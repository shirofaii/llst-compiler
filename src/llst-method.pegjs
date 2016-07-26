{
  function node(type, args) {
    var n = {type, location: location()}
    Object.assign(n, args)
    return n
  }
  
  function valueForReceiver(self, anObject) {
    return node('send', {
        receiver: self.receiver ? valueForReceiver(self.receiver, anObject) : anObject,
        selector: self.selector,
        arguments: self.arguments
    })
  }
}

start = method

separator 'space' =
[ \t\v\f\u00A0\uFEFF\n\r\u2028\u2029]+

comments 'comment' =
(["][^"]*["])+

ws '' =
(separator / comments)*

identifier 'identifier' =
first:[a-z] others:[a-zA-Z0-9]* {return first + others.join("")}

keyword =
first:identifier last:[:] {return first + last}

className 'class name' =
first:[A-Z] others:[a-zA-Z0-9]* {return first + others.join("")}

//litrals
literal 'literal' =
pseudoVariable / number / literalArray / string / symbol / block

string 'string' =
['] val:(("''" {return "'"} / [^'])*) [']
{
    return node('string', {
        value: val.join("").replace(/\"/ig, '"')
    })
}

symbol 'symbol' =
"#"val:$([a-zA-Z0-9]*)
{
    return node('symbol', {
        value: val.replace(/\"/ig, '"')
    })
}

number 'number' =
n:(float / integer)
{
    return node('number', {
        value: n
    })
}

float 'float' =
neg:[-]?int:integer "." dec:integer
{
    return parseFloat((neg+int+"."+dec), 10)
}

integer 'integer' =
neg:[-]?digits:[0-9]+
{
    return parseInt((neg || '')+digits.join(""), 10)
}

literalArray 'literal array' =
"#(" ws lits:(lit:literal ws {return lit})* ws ")"
{
    return node('literalArray', {
        value: lits
    })
}

pseudoVariable 'pseudo variable' =
val:('true' {return true} / 'false' {return false} / 'nil' {return null})
{
    return node('bool', {
        value: val
    })
}




variable 'variable' =
identifier:identifier
{
    return node('variable', {
        value: identifier
    })
}

classReference =
className:className
{
    return node('classReference', {
        value: className
    })
}

reference 'reference' =
variable / classReference / literal

keywordPair =
key:keyword ws arg:binarySend ws {return {key:key, arg: arg}}

binarySelector 'selector' =
!assignOperator bin:$([\\+*/=><,@%~|&-]+) {return bin.replace(/\\/g, '\\\\')}

unarySelector 'selector' =
identifier

keywordPattern =
pairs:(ws key:keyword ws arg:identifier {return {key:key, arg: arg}})+
{
    var keywords = [];
    var params = [];
    for(var i=0;i<pairs.length;i++){
        keywords.push(pairs[i].key);
    }
    for(var i=0;i<pairs.length;i++){
        params.push(pairs[i].arg);
    }
    return [keywords.join(""), params]
}

binaryPattern =
ws selector:binarySelector ws arg:identifier {return [selector, [arg]]}

unaryPattern =
ws selector:unarySelector {return [selector, []]}

expression =
assignment / cascade / keywordSend / binarySend / primitive

expressionList =
ws "." ws expression:expression {return expression}

expressions =
first:expression others:expressionList*
{
    var result = [first];
    for(var i=0;i<others.length;i++) {
        result.push(others[i]);
    }
    return result;
} 

assignOperator =
'<-'

assignment 'assignment' =
variable:variable ws assignOperator ws expression:expression
{
    return node('assignment', {
        left: variable,
        right: expression
    })
}

ret 'return' =
'^' ws expression:expression ws '.'?
{
    return node('return', {
        value: expression
    })
}

temps 'temps' =
"|" vars:(ws variable:identifier ws {return variable})* "|" {return vars}

blockParamList =
params:((ws ":" ws param:identifier {return param})+) ws "|" {return params}

subexpression 'subexpression' =
'(' ws expression:expression ws ')' {return expression}

statements =
ret:ret [.]*
{
    return [ret]
}
/ exps:expressions ws [.]+ ws ret:ret [.]*
{
    var expressions = exps;
    expressions.push(ret);
    return expressions
}
/ expressions:expressions? [.]*
{
    return expressions || []
}

sequence =
temps:temps? ws statements:statements? ws
{
    return node('sequence', {
        temps: temps || [],
        statements: statements || []
    })
}

block 'block' =
'[' ws params:blockParamList? ws sequence:sequence? ws ']'
{
    return node('block', {
        params: params || [],
        body: sequence
    })
}

operand =
reference / subexpression



unaryMessage =
ws selector:unarySelector ![:]
{
    return node('send', {
        selector: selector
    })
}

unaryTail =
message:unaryMessage ws tail:unaryTail? ws
{
    if(tail) {
        return valueForReceiver(tail, message);
    } else {
        return message;
    }
}

unarySend =
receiver:operand ws tail:unaryTail?
{
    if(tail) {
        return valueForReceiver(tail, receiver);
    } else {
        return receiver;
    }
}

binaryMessage =
ws selector:binarySelector ws arg:(unarySend / operand)
{
    return node('send', {
        selector: selector,
        arguments: [arg]
    })
}

binaryTail =
message:binaryMessage tail:binaryTail?
{
    if(tail) {
        return valueForReceiver(tail, message);
    } else {
        return message;
    }
}

binarySend =
receiver:unarySend tail:binaryTail?
{
    if(tail) {
        return valueForReceiver(tail, receiver);
    } else {
        return receiver;
    }
}

keywordMessage =
ws pairs:(pair:keywordPair ws {return pair})+
{
    var selector = [];
    var args = [];
    for(var i=0;i<pairs.length;i++) {
        selector.push(pairs[i].key);
        args.push(pairs[i].arg);
    }
    return node('send', {
        selector: selector.join(""),
        arguments: args
    })
}

keywordSend =
receiver:binarySend tail:keywordMessage
{
    return valueForReceiver(tail, receiver);
}

message =
binaryMessage / unaryMessage / keywordMessage

cascade =
ws send:(keywordSend / binarySend) messages:(ws ";" ws mess:message ws {return mess})+ 
{
    var cascade = [];
    cascade.push(send);
    for(var i=0;i<messages.length;i++) {
        cascade.push(messages[i]);
    }
    return node('cascade', {
        reciever: send.receiver,
        nodes: cascade
    })
}

primitive 'primitive' =
'<' ws code:integer ws args:primitiveArgs ws '>'
{
    return node('primitive', {
        code: code,
        arguments: args
    })
}
primitiveArgs =
args:(!block ref:reference ws {return ref})* {return args}


method =
ws pattern:(keywordPattern / binaryPattern / unaryPattern) ws sequence:sequence? ws
{
    return node('method', {
        selector: pattern[0],
        arguments: pattern[1],
        body: sequence
    })
}