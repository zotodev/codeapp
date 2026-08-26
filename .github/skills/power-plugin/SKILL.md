---
name: power-plugin
description: Builds Dataverse C# plug-ins exposed as Custom APIs, for server-side rules a code app calls. Use when authorization or transactional logic must be enforced regardless of client, beyond what security roles can express.
user-invocable: true
allowed-tools: Read, Edit, Write, Grep, Glob, Bash, LSP, TaskCreate, TaskUpdate, TaskList, TaskGet, AskUserQuestion, Skill
model: sonnet
---

**📋 Shared Instructions: [shared-instructions.md](${CLAUDE_PLUGIN_ROOT}/shared/shared-instructions.md)** - Cross-cutting concerns.

# Power Plugin

Build server-side business rules for Power Platform/Dataverse as C# plug-ins exposed through Custom APIs. The worked example below is a complete, copy-adaptable walkthrough: scaffold → implement rules → test → deploy → register the Custom API → verify over Web API. It assumes the **starved-role security model**: end users hold no Write on the target table; the plug-in (running as the plug-in user) is the only writer, so every client — code app, Postman, Excel — hits the same enforced path.

## When to Use

Use when a requirement needs data-dependent authorization or multi-table transactional logic that Dataverse security roles cannot express:

- Field-vs-field comparisons (approver rank > initiator rank)
- State-machine transitions guarded by caller attributes
- Any "user X may mutate Y only if Z" rule that must hold regardless of client

Don't use for: notifications/integrations (use Power Automate flows triggered by record changes), simple CRUD gating (security roles suffice), or read-only lookups (Custom API _functions_ are fine but often unnecessary).

## Prerequisites

```bash
dotnet --version                                    # .NET SDK (builds the net462 target)
pwsh -NoProfile -Command "pac --version"            # Power Platform CLI
pwsh -NoProfile -Command "pac auth list"            # confirm active profile
```

If `pac` is missing: install the VS Code extension **Power Platform Tools**, or `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`. Authenticate with `pwsh -NoProfile -Command "pac auth create --environment https://<yourenv>.crm.dynamics.com"`.

A solution in make.powerapps.com to hold all artifacts (tables, Custom APIs, assembly).

### Platform constraints — read before scaffolding

- **Plug-in assemblies must target .NET Framework 4.6.2 (`net462`).** This is not negotiable and it is what `pac plugin init` generates. Do not "modernize" the `TargetFramework` — Dataverse rejects assemblies built for .NET 8, and the failure surfaces late, at registration, after tests pass. (.NET Framework 4.8 support is announced but not yet shipped.) Put logic you want on a modern runtime in a **`netstandard2.0`** library instead: both `net462` and `net8.0` consume it.
- **Assemblies must be strong-name signed.** `pac plugin init` sets `SignAssembly` and generates a `.snk` for you. Leave it on.
- **First-time assembly registration currently needs Windows** (Plug-in Registration Tool or solution import). `pac plugin push` requires `--pluginId` of an already-registered assembly, so it updates rather than creates. Everything else — authoring, building, testing, Custom API setup, verification — is cross-platform.

## Architecture Rules (non-negotiable)

1. **Roles stay starved.** No human role gets Write on the protected table. Read/Create only. Verify in the security role editor before deploying anything.
2. **The plug-in is the only writer.** It performs the mutation via the plug-in user service after evaluating rules. Everything else gets 403 from platform authorization — that is the protection working.
3. **Rules live in exactly one place** (the plug-in). Code app / UI checks are cosmetic hints only, sourced from a GetMySkills-style function.
4. **Actions mutate, functions read.** `Is Function = No` → Action, state change. `Is Function = Yes` → pure query, no side effects.
5. **Bound actions operate on a row.** If the operation targets one record, set `Binding Type = Entity` so `Target` arrives automatically.

## Procedure — worked example: Approve-with-rank-check

Scenario: approvers may approve requests only when their Rank exceeds the initiator's Rank; SpecialApprovers bypass. Table: `appr_request` (column `appr_initiatorrank`). Caller rank/isSpecial on System User (`appr_rank`, `appr_isspecialapprover`).

### Step 1 — Scaffold

`pac plugin init` initializes **the directory you point it at** — it does not create a nested project folder, and the assembly name comes from the folder name, not a flag.

```bash
mkdir ApprovalPlugins
pwsh -NoProfile -Command "pac plugin init -o ApprovalPlugins"
```

✅ Check: the folder contains `ApprovalPlugins.csproj`, `ApprovalPlugins.snk`, `PluginBase.cs`, and a sample `Plugin1.cs`. Confirm `<TargetFramework>net462</TargetFramework>` — leave it as is.

### Step 2 — Implement the rule (thin shell + pure logic)

Keep rules in a static, dependency-free method; the plug-in class only fetches inputs and applies effects. This split makes the logic unit-testable without Dataverse.

Put `ApprovalRules` in a **`netstandard2.0`** class library (`ApprovalRules`) referenced by the plug-in project, so a modern test project can reference the same code:

```bash
dotnet new classlib -n ApprovalRules -f netstandard2.0
pwsh -NoProfile -Command "dotnet add ApprovalPlugins/ApprovalPlugins.csproj reference ApprovalRules/ApprovalRules.csproj"
```

```csharp
// ApprovalRules/ApprovalRules.cs
public static class ApprovalRules
{
    public static bool CanApprove(bool isSpecialApprover, int callerRank, int initiatorRank)
        => isSpecialApprover || callerRank > initiatorRank;
}
```

The plug-in shell. Note the two-argument constructor calling `base(typeof(T))` — `PluginBase` has no parameterless constructor, so omitting this does not compile:

```csharp
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

public class ApprovePlugin : PluginBase
{
    public ApprovePlugin(string unsecureConfiguration, string secureConfiguration)
        : base(typeof(ApprovePlugin)) { }

    protected override void ExecuteDataversePlugin(ILocalPluginContext localPluginContext)
    {
        var context = localPluginContext.PluginExecutionContext;
        var target = (EntityReference)context.InputParameters["Target"]; // bound row

        // PluginUserService runs as the plug-in user (elevated) — the starved-role model
        // depends on this being the only path that can write. InitiatingUserService would
        // run as the caller and hit the same 403 every other client gets.
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
            throw new InvalidPluginExecutionException(
                "You can't approve requests from equal/higher rank.");
        }

        // Effect: the ONLY sanctioned status flip happens here.
        svc.Update(new Entity("appr_request", target.Id)
        {
            ["statuscode"] = new OptionSetValue(2) // Approved
        });
    }
}
```

`ILocalPluginContext` exposes `InitiatingUserService`, `PluginUserService`, `PluginExecutionContext`, `TracingService`, `NotificationService`, and `OrgSvcFactory`. There is no `OrganizationService` member — choose the identity deliberately.

### Step 3 — Unit-test the pure logic (the runnable check)

The plug-in project targets `net462`, but the rules library is `netstandard2.0`, so the test project can target `net8.0` and run anywhere:

```bash
dotnet new xunit -n ApprovalRules.Tests -f net8.0
pwsh -NoProfile -Command "dotnet add ApprovalRules.Tests/ApprovalRules.Tests.csproj reference ApprovalRules/ApprovalRules.csproj"
```

```csharp
[Theory]
[InlineData(false, 3, 5, false)]  // lower rank → denied
[InlineData(false, 6, 5, true)]   // higher rank → allowed
[InlineData(true,  1, 9, true)]   // special overrides
public void CanApprove_MatchesPolicy(bool special, int callerRank, int initiatorRank, bool expected)
    => Assert.Equal(expected, ApprovalRules.CanApprove(special, callerRank, initiatorRank));
```

Run: `dotnet test ApprovalRules.Tests`. ✅ Check: all green before any deploy.

### Step 4 — Build and deploy

```bash
pwsh -NoProfile -Command "dotnet build ApprovalPlugins/ApprovalPlugins.csproj -c Release"
```

Register the assembly:

- **First registration:** Plug-in Registration Tool (`pwsh -NoProfile -Command "pac tool prt"` → Register New Assembly → select `bin/Release/net462/ApprovalPlugins.dll`). **Windows only.** Alternatively import a solution containing the assembly.
- **Subsequent updates:** `pwsh -NoProfile -Command "pac plugin push -id <pluginId> -c Release"`, where `<pluginId>` is the ID of the already-registered assembly or package.

The build produces both a plug-in **package** (`bin/Release/ApprovalPlugins.1.0.0.nupkg`) and the raw assembly (`bin/Release/net462/ApprovalPlugins.dll`). `pac plugin push` defaults to `--type Nuget` (the package); pass `--type Assembly` to push the bare DLL. Your referenced `netstandard2.0` rules library is copied into the output next to the plug-in assembly, so it ships with either.

✅ Check: the assembly and its plug-in types appear under your solution's Plug-in Assemblies.

### Step 5 — Register the Custom API

Solution → **New → More → Custom API**:

| Field                              | Value                                                            |
| ---------------------------------- | ---------------------------------------------------------------- |
| Unique Name                        | `appr_Approve` (globally unique, becomes the OData name)         |
| Is Function                        | No (an Action — it changes state)                                |
| Binding Type                       | Entity                                                           |
| Bound Entity Logical Name          | `appr_request` (Target flows in automatically)                   |
| Plugin Type                        | `ApprovePlugin`                                                  |
| Allowed Custom Processing Step Type | None (unless other developers should extend this)               |
| Is Private                         | No while developing — `true` hides it from `$metadata`           |

Child records: **Custom API Request Parameter** → `Comments` (String, Optional). Response Property → `Success` (Boolean) if you return one.

Repeat Steps 2–6 per operation (`appr_Initiate` global, `appr_Verify` bound, `appr_GetMySkills` as a Function returning skill booleans). Contract first, then plug-in, then API record.

✅ Check: **Is Function** and **Allowed Custom Processing Step Type** cannot be changed after creation — get those two right the first time, or delete and recreate. Request parameters and response properties remain customizable in an unmanaged solution, so those you can iterate on. (Before shipping a managed solution, set **Is Customizable** to false on the API and its parameters so consumers can't break your contract.)

### Step 6 — Verify over Web API before touching any client

Logged-in browser session (POST via devtools/fetch or any REST client with session auth). Note the closing paren before the slash:

```
POST https://<yourenv>.crm.dynamics.com/api/data/v9.2/appr_requests(<guid>)/Microsoft.Dynamics.CRM.appr_Approve
{ "Comments": "ok" }
```

✅ Check: 204 on success with no response property (200 if one is returned); **400 carrying the exact exception message** on rank violation; 403 for users without even Read.

A 404 means the operation isn't in `$metadata`: **Is Private** is set to true, the Unique Name is misspelled, a Function was defined without any response property (invalid, so it never appears), or metadata hasn't refreshed yet (wait ~15 min).

## Consumption (client side, brief)

Code apps generate typed artifacts from the registered APIs. This uses the **`pa` CLI** (`@microsoft/power-apps` v1.1.1+), not `pac`:

```bash
pa app find-dataverse-api --search "appr_"     # confirm visibility; --json for scripting
pa app add dataverse-api --api-name appr_Approve
```

This writes `<schemaPath>/dataverse/appr_Approve.Schema.json`, updates `power.config.json` and `dataSourcesInfo.ts`, and generates `<codeGenPath>/generated/services/appr_ApproveService.ts`.

Import the generated service and call it. **For a bound action the record id is the first argument:**

```typescript
import { appr_ApproveService } from './generated/services/appr_ApproveService';

const result = await appr_ApproveService.appr_Approve(requestId, comments);
```

Render plug-in rejection messages verbatim from the 400 body (`error.message`). Re-run `pa app add dataverse-api` after any contract change — TypeScript flags moved call sites.

## Pitfalls

- **Direct PATCH returns 403 — that's success.** `RequestService.update(id, { statuscode: 2 })` dying at the door IS the design working; the generated SDK calls Dataverse as the signed-in user, whose roles have no Write.
- **Do not retarget the plug-in project.** `net462` is a platform requirement, not a leftover default. See Platform constraints.
- **Plug-ins run as the caller unless you say otherwise.** `InitiatingUserService` is the caller; `PluginUserService` is elevated. This example escalates on purpose because the whole model depends on it — elsewhere, escalate deliberately, never by habit.
- **If initiators edit drafts**, give table Write but enable field-level security on `statuscode`/decision columns and grant Write on those fields to nobody; SYSTEM ignores FLS.
- **Unique Name collisions** across environments fail deployment — keep the publisher prefix discipline.
- **Functions must stay side-effect-free**; nothing enforces it but review discipline.
- **You can't pass secure/unsecure configuration** to a Custom API's main-operation plug-in, and the PRT profiler can't debug the main operation. Workaround for both: register the plug-in on `PostOperation` instead — which requires `Allowed Custom Processing Step Type` to be Sync and Async, set at creation time.
- Optional hardening once rules multiply: a synchronous Update-step validator that throws when `statuscode` appears in the incoming Target and the caller isn't SYSTEM — converts future role drift into a loud error.

## Verification Checklist

- [ ] No human role holds Write on the protected table (or FLS covers decision columns)
- [ ] Plug-in project still targets `net462` and is strong-name signed
- [ ] `dotnet test` green on pure rule logic before deploy
- [ ] Assembly visible in solution after deploy
- [ ] Custom API: `Is Function` correct, Binding Type + Bound Entity Logical Name set, Plugin Type wired
- [ ] POST as an under-ranked caller → 400 with the policy message; compliant POST → 204 and status changed
- [ ] Direct PATCH as end user → 403
