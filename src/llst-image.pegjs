start = image

separator 'space' =
[ \t]+

eol 'end of line' =
[\n\r]+

emptyLine =
ws eol

syntaxComment =
(["][^"]*["])+

ws '' =
(separator / syntaxComment)*

identifier 'identifier' =
first:[a-z] others:[a-zA-Z0-9]* {return first + others.join("")}

className 'class name' =
"nil" {return null} / first:[A-Z] others:[a-zA-Z0-9]* {return first + others.join("")}

comment 'comment' =
ws "COMMENT" text:$[^\n\r]* eol {return text}

class 'class' =
ws "CLASS" separator name:className
separator subclassOf:className
instanceOf:(separator s:className {return s})?
ws vars:(v:identifier ws {return v})* eol
{
	return {
    	type: 'class',
        name: name,
        instanceOf: instanceOf,
        subclassOf: subclassOf,
        variables: vars
    }
}

rawClass 'raw class' =
ws "RAWCLASS" separator name:className
separator instanceOf:className
separator subclassOf:className
vars:(ws v:identifier {return v})* ws eol
{
	return {
    	type: 'rawclass',
        name: name,
        subclassOf: subclassOf,
        instanceOf: instanceOf,
        variables: vars
    }
}

methodEnd =
"!" ws eol

methodLine =
$([^!] [^\n\r]* eol)

method 'method' =
ws "METHOD" separator className:className ws eol
body:$(methodLine*) methodEnd
{
	return {
    	type: 'method',
        className: className,
        source: body
    }
}

expression =
emptyLine / comment / class / rawClass / method 

image = 
exps:expression* ws ("BEGIN" .*)?
{
	return exps.filter(x => x.type)
}