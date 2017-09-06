/**
 * Structure Test
 */
QUnit.test("App Structure Test", function(assert)
{
    assert.ok(typeof App === "object", "Base Object (App) [OK]");
    assert.ok(typeof App.Components === "object", "App.Components Object [OK]");
    assert.ok(typeof App.Events === "object", "App.Events Object [OK]");
    assert.ok(typeof App.Helpers === "object", "App.Helpers Object [OK]");
    assert.ok(typeof App.Modules === "object", "App.Modules Object [OK]");
    assert.ok(typeof App.Request === "object", "App.Request Object [OK]");
    assert.ok(typeof App.Router === "object", "App.Router Object [OK]");
    assert.ok(typeof App.Session === "object", "App.Session Object [OK]");
    assert.ok(typeof App.Settings === "object", "App.Settings Object [OK]");
    assert.ok(typeof App.Validator === "object", "App.Validator Object [OK]");
});


/**
 * Settings Test
 */
QUnit.test("App Settings Test", function(assert)
{
    assert.ok(typeof App.Settings.ApiEndpoints === "object", "API Endpoints [OK]");
    assert.ok(typeof App.Settings.AppName === "string" && App.Settings.AppName != '', "App Name [OK]");
    assert.ok(typeof App.Settings.FilterOperator === "object", "Filter Operators Object [OK]");
    assert.ok(typeof App.Settings.SessionTimeout === "number" && App.Settings.SessionTimeout > 0, "Session Timeout [OK]");
    assert.ok(typeof App.Settings.UserAction === "object", "User Action Object [OK]");
});