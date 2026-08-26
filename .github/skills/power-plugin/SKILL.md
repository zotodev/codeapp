---
name: power-plugin
description: "Build Dataverse plugins + Custom APIs end to end in VS Code."
---

# Power Plugin Skill

Build server-side business rules for Power Platform/Dataverse as C# plug-ins exposed through Custom APIs — entirely in VS Code (no Visual Studio needed). The worked example below is a complete, copy-adaptable walkthrough: scaffold → implement rules → test → deploy → register the Custom API → verify over Web API. It assumes the **starved-role security model**: end users hold no Write on the target table; the plug-in (running elevated) is the only writer, so every client — React app, Postman, Excel — hits the same enforced path.

## When to Use

Use when a requirement needs data-dependent authorization or multi-table transactional logic that Dataverse security roles cannot express:

- Field-vs-field comparisons (approver rank > initiator rank)
- State-machine transitions guarded by caller attributes
- Any "user X may mutate Y only if Z" rule that must hold regardless of client

Don't use for: notifications/integrations (use Power Automate flows triggered by record changes), simple CRUD gating (security roles suffice), or read-only lookups (Custom API _functions_ are fine but often unnecessary).

## Prerequisites

```bash
dotnet --version        # .NET 8 SDK+
pac --version           # Power Platform CLI — via VS Code extension "Power Platform Tools", or:
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
pac auth create --environment https://<yourenv>.crm.dynamics.com
pac auth list           # confirm active profile
```

A solution in make.powerapps.com to hold all artifacts (tables, Custom APIs, assembly).

## Architecture Rules (non-negotiable)

1. **Roles stay starved.** No human role gets Write on the protected table. Read/Create only. Verify in the security role editor before deploying anything.
2. **The plug-in is the only writer.** It performs the mutation via its service layer after evaluating rules. Everything else gets 403 from platform authorization — that is the protection working.
3. **Rules live in exactly one place** (the plug-in). React/UI checks are cosmetic hints only, sourced from a GetMySkills-style function.
4. **Actions mutate, functions read.** Custom API type Action = state change; Function (Is Function = true) = pure query, no side effects.
5. **Bound actions operate on a row.** If the operation targets one record, set Entity Logical Name so `Target` arrives automatically.

## Procedure — worked example: Approve-with-rank-check

Scenario: approvers may approve requests only when their Rank exceeds the initiator's Rank; SpecialApprovers bypass. Table: `appr_request` (columns `appr_initiatorrank`). Caller rank/isSpecial on System User (`appr_rank`, `appr_isspecialapprover`).

### Step 1 — Scaffold

```bash
mkdir ApprovalPlugins && cd ApprovalPlugins
pac plugin init -n ApprovalPlugins
cd ApprovalPlugins.ClassLibrary
```

✅ Check: folder contains `ApprovalPlugins.ClassLibrary.csproj` and a base plugin class.

### Step 2 — Target .NET 8

Open the `.csproj`; if `<TargetFramework>` is `net462`/`net48`, change to `net8.0` (builds on any OS, supported by Dataverse).

### Step 3 — Implement the rule (thin shell + pure logic)

Keep rules in a static, dependency-free method; the plug-in class only fetches inputs and applies effects. This split makes the logic unit-testable without Dataverse.

```csharp
public static class ApprovalRules
{
    public static bool CanApprove(bool isSpecialApprover, int callerRank, int initiatorRank)
        => isSpecialApprover || callerRank > initiatorRank;
}

public class ApprovePlugin : PluginBase
{
    protected override void ExecuteDataversePlugin(ILocalPluginContext local)
    {
        var ctx = local.PluginExecutionContext;
        var target = (EntityReference)ctx.InputParameters["Target"]; // bound row

        var svc = local.PluginUserService ?? local.OrganizationService;
        var caller = svc.Retrieve("systemuser", ctx.InitiatingUserId,
            new ColumnSet("appr_rank", "appr_isspecialapprover"));
        var req = svc.Retrieve("appr_request", target.Id,
            new ColumnSet("appr_initiatorrank"));

        if (!ApprovalRules.CanApprove(
                caller.Get<bool>("appr_isspecialapprover"),
                caller.Get<int>("appr_rank"),
                req.Get<int>("appr_initiatorrank")))
            throw new InvalidPluginExecutionException(OperationStatus.Failed,
                "You can't approve requests from equal/higher rank.");

        // Effect: the ONLY sanctioned status flip happens here (elevated context).
        svc.Update(new Entity("appr_request", target.Id)
        {
            ["statuscode"] = new OptionSetValue(2) // Approved
        });
    }
}
```

### Step 4 — Unit-test the pure logic (the runnable check)

```csharp
[Theory]
[InlineData(false, 3, 5, false)]  // lower rank → denied
[InlineData(false, 6, 5, true)]   // higher rank → allowed
[InlineData(true,  1, 9, true)]   // special overrides
public void CanApprove_MatchesPolicy(bool special, int callerRank, int initiatorRank, bool expected)
    => Assert.Equal(expected, ApprovalRules.CanApprove(special, callerRank, initiatorRank));
```

Run: `dotnet test`. ✅ Check: all green before any deploy.

### Step 5 — Build and deploy

```bash
dotnet build -c Release
```

Deploy with the **Power Platform Tools** VS Code extension (command palette → "Power Platform Tools: Deploy" while the class library is open), or `pac plugin push` if available, or the Plug-in Registration Tool (`pac tool prt` → Register New Assembly → select `bin/Release/net8.0/ApprovalPlugins.dll`).

✅ Check: the assembly and its plugin types appear under your solution's Plug-in Assemblies.

### Step 6 — Register the Custom API

Solution → **New → More → Custom API**:

| Field               | Value                                                           |
| ------------------- | --------------------------------------------------------------- |
| Unique Name         | `appr_Approve` (globally unique, immutable, becomes OData name) |
| Type                | Action                                                          |
| Entity Logical Name | `appr_request` (bound — Target flows in)                        |
| Plugin Type         | `ApprovePlugin`                                                 |
| Enabled for Web API | ✅ (without this it never appears in `$metadata`)               |

Child records: **Custom API Request Parameter** → `Comments` (String, Optional). Response Property → `Success` (Boolean) if you return one.

Repeat Steps 3–6 per operation (`appr_Initiate` unbound, `appr_Verify` bound, `appr_GetMySkills` as Function returning skill booleans). Contract first, then plugin, then API record.

✅ Check: parameter names/types correct at creation — they are **immutable**; wrong type = delete + recreate.

### Step 7 — Verify over Web API before touching any client

Logged-in browser session (POST via devtools/fetch or any REST client with session auth):

```
POST https://<yourenv>.crm.dynamics.com/api/data/v9.2/appr_requests(<guid>/Microsoft.Dynamics.CRM.appr_Approve)
{ "Comments": "ok" }
```

✅ Check: 200/204 on success; **400 carrying the exact exception message** on rank violation; 403 for users without even Read. A 404 means "Enabled for Web API" is off or metadata hasn't refreshed (wait ~15 min).

## Consumption (client side, brief)

Code apps generate typed artifacts from the registered APIs:

```bash
pa app find-dataverse-api --search "appr_"     # confirm visibility
pa app add dataverse-api --api-name appr_Approve
```

Import the generated service and call it; render plug-in rejection messages verbatim from the 400 body (`error.message`). Re-run `add dataverse-api` after any contract change — TypeScript flags moved call sites.

## Pitfalls

- **Direct PATCH returns 403 — that's success.** `RequestService.update(id, { statuscode: 2 })` dying at the door IS the design working; the generated SDK calls Dataverse as the signed-in user, whose roles have no Write.
- **Plug-ins run as caller by default** — callers need whatever table rights the effect requires unless you intentionally use the elevated plugin-user service. Escalate deliberately, never by habit.
- **If initiators edit drafts**, give table Write but enable field-level security on `statuscode`/decision columns and grant Write on those fields to nobody; SYSTEM ignores FLS.
- **Unique Name collisions** across environments fail deployment — keep the publisher prefix discipline.
- **Functions must stay side-effect-free**; nothing enforces it but review discipline.
- Optional hardening once rules multiply: synchronous Update-step validator throwing when `statuscode` appears in the incoming Target and caller ≠ SYSTEM — converts future role drift into a loud error.

## Verification Checklist

- [ ] No human role holds Write on the protected table (or FLS covers decision columns)
- [ ] `dotnet test` green on pure rule logic before deploy
- [ ] Assembly visible in solution after deploy
- [ ] Custom API: correct binding, Plugin Type wired, Enabled for Web API ✅
- [ ] Unauthenticated-of-rank POST → 400 with policy message; compliant POST → 204 and status changed
- [ ] Direct PATCH as end user → 403
