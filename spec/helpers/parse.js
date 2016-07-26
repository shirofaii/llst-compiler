function isNode(n) {
    return n && typeof(n.type) === 'string'
}

function node(a, b) {
    if(b) { return isNode(a) && a.type === b }
    return isNode(a)
}

function nodeWithValue(a, b) {
    return a.value === b
}

beforeEach(function () {
    jasmine.addMatchers({
        node: function () { return { compare: function (a, b) { return { pass: node(a, b) } } } },
        nodeWithValue: function () { return { compare: function (a, b) { return { pass: nodeWithValue(a, b) } } } }
    })
});