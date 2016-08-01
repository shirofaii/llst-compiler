function nodeType(orig, nodeType) {
    if(nodeType === undefined) return true
    
    return orig.type === nodeType
}

function nodeValue(orig, value) {
    if(value === undefined) return true
    
    return orig.value == value
}

function literalNode(orig, type, value) {
    return nodeType(orig, type) && nodeValue(orig, value)
}

function sendNode(orig, send) {
    if(orig.type !== 'send') return false
    if(orig.selector !== send.selector) return false
    if(orig.arguments && send.arguments && orig.arguments.length !== send.arguments.length) return false
    
    // same receiver
    var result = node(orig.receiver, send.receiver)
    
    // have no arguments
    if(!orig.arguments && !send.arguments) {
        return result
    }
    // and all argements same
    orig.arguments.forEach((arg, i) => result = result && node(arg, send.arguments[i]))
    return result
}

function node(orig, node) {
    if(node.type === 'send') {
        return sendNode(orig, node)
    }
    return literalNode(orig, node.type, node.value)
}

beforeEach(function () {
    jasmine.addMatchers({
        node: function () { return { compare: function (a, b) { return { pass: node(a, b) } } } },
        literalNode: function () { return { compare: function (a, b) { return { pass: literalNode(a, b) } } } },
        sendNode: function () { return { compare: function (a, b) { return { pass: sendNode(a, b) } } } },
        nodeValue: function () { return { compare: function (a, b) { return { pass: nodeValue(a, b) } } } },
        nodeType: function () { return { compare: function (a, b) { return { pass: nodeType(a, b) } } } }
    })
});
