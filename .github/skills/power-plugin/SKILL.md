---
name: power-plugin
description: Creates a Dataverse C# plug-in project in VS Code and exposes it as a Custom API. Use when building server-side business logic for Dataverse — scaffolding a plug-in, writing plug-in code, or registering a Custom API.
user-invocable: true
allowed-tools: Read, Edit, Write, Grep, Glob, Bash, LSP, TaskCreate, TaskUpdate, TaskList, TaskGet, AskUserQuestion, Skill
model: sonnet
---

**📋 Shared Instructions: [shared-instructions.md](${CLAUDE_PLUGIN_ROOT}/shared/shared-instructions.md)** - Cross-cutting concerns.

# Power Plugin

Build a Dataverse plug-in in C# and expose it as a Custom API — entirely in VS Code, no Visual Studio required. A plug-in runs server-side inside Dataverse, so its rules hold for every client: code apps, Power Automate, Postman, Excel.

## When to Use

Use for logic that must run on the server and cannot be expressed with security roles or business rules:

- Data-dependent authorization (approver rank must exceed initiator rank)
- Multi-table transactional writes that must succeed or fail together
- State-machine transitions guarded by caller attributes

Don't use for notifications or integrations (use Power Automate), or simple CRUD gating (security roles suffice).

## Prerequisites

```bash
dotnet --version                                    # .NET SDK
pwsh -NoProfile -Command "pac --version"            # Power Platform CLI
pwsh -NoProfile -Command "pac auth list"            # confirm an active profile
```

Install `pac` via the VS Code extension **Power Platform Tools**, or:

```bash
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
pwsh -NoProfile -Command "pac auth create --environment https://<yourenv>.crm.dynamics.com"
```

You also need a solution in make.powerapps.com to hold the assembly and Custom API.

### Platform constraints

- **Plug-in assemblies must target .NET Framework 4.6.2 (`net462`)** — this is what `pac plugin init` generates. Never change `<TargetFramework>`. Dataverse rejects assemblies built for .NET 8, and it fails at registration, long after the build succeeds.
- **Assemblies must be strong-name signed.** `pac plugin init` sets `SignAssembly` and generates a `.snk`. Leave both alone.
- Authoring, building, and Custom API setup are cross-platform. **First-time assembly registration needs Windows** (see Step 4).

## Step 1 — Scaffold the project

`pac plugin init` initializes the directory you point it at. It does not create a nested project folder, and the assembly name comes from the folder name — there is no name flag.

```bash
mkdir ApprovalPlugins
pwsh -NoProfile -Command "pac plugin init -o ApprovalPlugins"
```

This generates:

```
ApprovalPlugins/
  ApprovalPlugins.csproj      <- net462, SignAssembly=true
  ApprovalPlugins.snk         <- strong-name key
  PluginBase.cs               <- base class + ILocalPluginContext
  Plugin1.cs                  <- sample plug-in, rename or delete
  .vscode/tasks.json
```

## Step 2 — Set up the project to write code in

Keep business rules in a separate `netstandard2.0` library. The plug-in project is pinned to `net462`, but `netstandard2.0` is consumable by both `net462` and `net8.0`, so the same rules can be referenced by a modern test project and run anywhere.

```bash
dotnet new classlib -n ApprovalRules -f netstandard2.0
pwsh -NoProfile -Command "dotnet add ApprovalPlugins/ApprovalPlugins.csproj reference ApprovalRules/ApprovalRules.csproj"
```

Optionally add a test project for the rules:

```bash
dotnet new xunit -n ApprovalRules.Tests -f net8.0
pwsh -NoProfile -Command "dotnet add ApprovalRules.Tests/ApprovalRules.Tests.csproj reference ApprovalRules/ApprovalRules.csproj"
```

Resulting layout:

```
ApprovalPlugins/        <- net462   plug-in shell (Dataverse calls this)
ApprovalRules/          <- netstandard2.0   pure rules, no SDK dependency
ApprovalRules.Tests/    <- net8.0    optional
```

The referenced rules library is copied into the plug-in's build output automatically, so it ships with the assembly.

## Step 3 — Write the plug-in

Scenario: approvers may approve a request only when their rank exceeds the initiator's; special approvers bypass the check.

**Pure rules** — no Dataverse dependency, so they stay trivially testable:

```csharp
// ApprovalRules/ApprovalRules.cs
public static class ApprovalRules
{
    public static bool CanApprove(bool isSpecialApprover, int callerRank, int initiatorRank)
        => isSpecialApprover || callerRank > initiatorRank;
}
```

**Plug-in shell** — fetches inputs, applies the rule, performs the effect:

```csharp
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

public class ApprovePlugin : PluginBase
{
    // Required: PluginBase has no parameterless constructor.
    public ApprovePlugin(string unsecureConfiguration, string secureConfiguration)
        : base(typeof(ApprovePlugin)) { }

    protected override void ExecuteDataversePlugin(ILocalPluginContext localPluginContext)
    {
        var context = localPluginContext.PluginExecutionContext;
        var target = (EntityReference)context.InputParameters["Target"]; // bound row

        // PluginUserService runs elevated as the plug-in user.
        // InitiatingUserService runs as the caller — pick deliberately.
        var svc = localPluginContext.PluginUserService;

        var caller = svc.Retrieve("systemuser", context.InitiatingUserId,
            new ColumnSet("appr_rank", "appr_isspecialapprover"));
        var request = svc.Retrieve("appr_request", target.Id,
            new ColumnSet("appr_initiatorrank"));

        if (!ApprovalRules.CanApprove(
                caller.GetAttributeValue<bool>("appr_isspecialapprover"),
                caller.GetAttributeValue<int>("appr_rank"),
                request.GetAttributeValue<int>("appr_initiatorrank")))
        {
            // Surfaces to the caller as HTTP 400 with this exact message.
            throw new InvalidPluginExecutionException(
                "You can't approve requests from equal or higher rank.");
        }

        svc.Update(new Entity("appr_request", target.Id)
        {
            ["statuscode"] = new OptionSetValue(2) // Approved
        });
    }
}
```

**API notes:**

- `ILocalPluginContext` exposes `InitiatingUserService`, `PluginUserService`, `PluginExecutionContext`, `TracingService`, `NotificationService`, `OrgSvcFactory`. There is no `OrganizationService` member.
- Read columns with `GetAttributeValue<T>("name")`.
- `localPluginContext.TracingService.Trace(...)` output appears in the Plug-in Trace Log.

## Step 4 — Build and register the assembly

```bash
pwsh -NoProfile -Command "dotnet build ApprovalPlugins/ApprovalPlugins.csproj -c Release"
```

The build produces a plug-in package (`bin/Release/ApprovalPlugins.1.0.0.nupkg`) and the raw assembly (`bin/Release/net462/ApprovalPlugins.dll`).

- **First registration** — Plug-in Registration Tool (`pwsh -NoProfile -Command "pac tool prt"` → Register New Assembly), or import a solution containing the assembly. PRT is **Windows only**.
- **Updates** — `pwsh -NoProfile -Command "pac plugin push -id <pluginId> -c Release"`. `--type` defaults to `Nuget` (the package); pass `--type Assembly` for the bare DLL.

Then add the assembly and its plug-in types to your solution.

## Step 5 — Expose it as a Custom API

Solution → **New → More → Custom API**:

| Field                               | Value                                                    |
| ----------------------------------- | -------------------------------------------------------- |
| Unique Name                         | `appr_Approve` — becomes the OData operation name        |
| Is Function                         | No (Action: changes state) / Yes (Function: read-only)   |
| Binding Type                        | Entity — the operation targets one record                |
| Bound Entity Logical Name           | `appr_request` — `Target` is then supplied automatically |
| Plugin Type                         | `ApprovePlugin`                                          |
| Allowed Custom Processing Step Type | None, unless others should extend this operation         |
| Is Private                          | No while developing — Yes hides it from `$metadata`      |

Add child records for the contract: **Custom API Request Parameter** (e.g. `Comments`, String, Optional) and **Custom API Response Property** (e.g. `Success`, Boolean).

**Set at creation time, cannot be changed later:** `Is Function` and `Allowed Custom Processing Step Type`. Request parameters and response properties stay editable in an unmanaged solution.

Repeat Steps 3–5 for each operation — define the contract first, then the plug-in, then the Custom API record.

---

## Additional — Using the Custom API

### From a code app

Generate a typed client with the **`pa` CLI** (`@microsoft/power-apps` v1.1.1+ — this is not `pac`):

```bash
pa app find-dataverse-api --search "appr_"
pa app add dataverse-api --api-name appr_Approve
```

This writes the operation schema, updates `power.config.json` and `dataSourcesInfo.ts`, and generates `src/generated/services/appr_ApproveService.ts`.

For a **bound** action, the record id is the first argument:

```typescript
import { appr_ApproveService } from './generated/services/appr_ApproveService';

const result = await appr_ApproveService.appr_Approve(requestId, comments);
```

Re-run `pa app add dataverse-api` after any contract change to regenerate. Render rejection messages from the 400 body (`error.message`) — that text is the one thrown by the plug-in.

### Directly over the Web API

```
POST https://<yourenv>.crm.dynamics.com/api/data/v9.2/appr_requests(<guid>)/Microsoft.Dynamics.CRM.appr_Approve
Content-Type: application/json

{ "Comments": "ok" }
```

Note the closing paren before the slash. Bound operations always use the fully qualified name `Microsoft.Dynamics.CRM.<UniqueName>`. Expect 204 (or 200 with a response property), and 400 carrying the plug-in's exception message when a rule rejects the call.

A 404 means the operation isn't in `$metadata`: `Is Private` is Yes, the Unique Name is misspelled, a Function was defined without a response property (invalid), or metadata hasn't refreshed yet (~15 min).

### Gotchas

- Plug-ins run as the **caller** unless you use `PluginUserService`. If the effect needs rights the caller lacks, escalate — deliberately, not by habit.
- Functions must be side-effect-free. Nothing enforces this.
- You **cannot** pass secure/unsecure configuration to a Custom API's main-operation plug-in, and PRT's profiler can't debug it. Workaround for both: register the plug-in on `PostOperation` instead, which requires `Allowed Custom Processing Step Type` = Sync and Async, set at creation.
- Unique Name collisions across environments fail deployment — keep the publisher prefix consistent.
