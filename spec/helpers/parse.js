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


function cascadeNode(orig, cascade) {
    if(orig.type !== 'cascade') return false
    if(orig.messages.length !== cascade.messages.length) return false
    
    var result = node(orig.receiver, cascade.receiver)
    // all subnodes are same
    orig.messages.forEach((msg, i) => {
        result = result && msg.selector === cascade.messages[i].selector
        if(msg.arguments) {
            msg.arguments.forEach((arg, j) => result = result && node(arg, cascade.messages[i].arguments[j]))
        }
    })
    return result
}

function primitiveNode(orig, code, args) {
    if(orig.type !== 'primitive') return false
    if(!args) args = []
    if(orig.arguments.length !== args.length) return false

    var result = orig.code === code
    // all argements are same
    orig.arguments.forEach((arg, i) => result = result && node(arg, args[i]))
    return result
}

function assignmentNode(orig, left, right) {
    return node(orig.left, left) && node(orig.right, right)
}

function blockNode(orig, stats, args, temps) {
    if(orig.type !== 'block') return false
    if(!args) args = []
    if(!temps) temps = []
    if(orig.arguments.length !== args.length) return false
    if(orig.body.temps.length !== temps.length) return false
    
    var result = true
    // all argements same
    orig.arguments.forEach((arg, i) => result = result && node(arg, args[i]))
    // and all vars same
    orig.body.temps.forEach((tmp, i) => result = result && node(tmp, temps[i]))

    // all instructions are same
    orig.body.statements.forEach((st, i) => result = result && node(st, stats[i]))
    return result
}


function node(orig, node) {
    switch(node.type) {
        case 'send': return sendNode(orig, node)
        case 'cascade': return cascadeNode(orig, node)
        case 'assignment': return assignmentNode(orig, node.left, node.right)
        case 'primitive': return primitiveNode(orig, node.code, node.arguments)
        case 'blockNode': return blockNode(orig, node.body.statements, node.arguments, node.body.temps)
        default: return literalNode(orig, node.type, node.value)
    }
}

beforeEach(function () {
    jasmine.addMatchers({
        node: function () { return { compare: function (a, b) { return { pass: node(a, b) } } } },
        literalNode: function () { return { compare: function (a, b, c) { return { pass: literalNode(a, b, c) } } } },
        sendNode: function () { return { compare: function (a, b) { return { pass: sendNode(a, b) } } } },
        blockNode: function () { return { compare: function (a, b, c, d) { return { pass: blockNode(a, b, c, d) } } } },
        assignmentNode: function () { return { compare: function (a, b, c) { return { pass: assignmentNode(a, b, c) } } } },
        primitiveNode: function () { return { compare: function (a, b, c) { return { pass: primitiveNode(a, b, c) } } } },
        cascadeNode: function () { return { compare: function (a, b) { return { pass: cascadeNode(a, b) } } } },
        nodeValue: function () { return { compare: function (a, b) { return { pass: nodeValue(a, b) } } } },
        nodeType: function () { return { compare: function (a, b) { return { pass: nodeType(a, b) } } } }
    })
});
