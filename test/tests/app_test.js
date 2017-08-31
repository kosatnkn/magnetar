QUnit.test( "hello test", function( assert ) {
    assert.ok( 1 == "1", "Passed!" );
});

QUnit.test( "hello test2", function( assert ) {
    assert.ok( typeof App === "object", "Passed!" );
});