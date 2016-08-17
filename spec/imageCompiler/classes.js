const compile = require('../../src/imageCompiler.js').compile
const ImageEncoder = require('../../src/imageCompiler.js').ImageEncoder
const _ = require('lodash')


describe('llst image bootstrap', function() {
    var tryCompile = function(text) { return () => {compile(text)} }
    
    it('circular classes', function() {
        var encoder = compile(`
RAWCLASS Object MetaObject nil
RAWCLASS Class      MetaClass Object      name parentClass methods size variables children
RAWCLASS MetaObject Class     Class
RAWCLASS MetaClass  Class     MetaObject
        `)
        expect(_.map(encoder.classes, x => x.name).sort()).toEqual(['Object', 'MetaObject', 'Class', 'MetaClass'].sort())
        expect(encoder.classes['Object'].size).toBe(0)
        expect(encoder.classes['Class'].size).toBe(6)
        expect(encoder.classes['Object'].parentClass).toBe(null)
        expect(encoder.classes['Object'].metaClass).toBe(encoder.classes['MetaObject'])
        expect(encoder.classes['Class'].metaClass).toBe(encoder.classes['MetaClass'])
        expect(encoder.classes['Class'].parentClass).toBe(encoder.classes['Object'])
    })
    
    it('classes', function() {
        var encoder = compile(`
RAWCLASS Object MetaObject nil
RAWCLASS Class      MetaClass Object      name parentClass methods size variables children
RAWCLASS MetaObject Class     Class
RAWCLASS MetaClass  Class     MetaObject
CLASS Undefined     Object
CLASS Boolean       Object
CLASS True          Boolean
CLASS False         Boolean
        `)
        expect(encoder.classes['False'].parentClass).toBe(encoder.classes['True'].parentClass)
        expect(encoder.classes['False'].parentClass).toBe(encoder.classes['Boolean'])
        expect(encoder.classes['False'].metaClass).toBe(encoder.classes['MetaFalse'])
        expect(encoder.classes['MetaFalse'].metaClass).toBe(encoder.classes['Class'])
        expect(encoder.classes['MetaFalse'].parentClass).toBe(encoder.classes['MetaBoolean'])
    })
    
    it('classes size', function() {
        var encoder = compile(`
RAWCLASS Object MetaObject nil
RAWCLASS Class      MetaClass Object      name parentClass methods size variables children
RAWCLASS MetaObject Class     Class
RAWCLASS MetaClass  Class     MetaObject
CLASS Context       Object method arguments temporaries stack bytePointer stackTop previousContext
CLASS Block         Context argumentLocation creatingContext oldBytePointer
        `)
        expect(encoder.classes['Context'].size).toBe(7)
        expect(encoder.classes['Block'].size).toBe(10)
    })
    
    it('class method', function() {
        var encoder = compile(`
RAWCLASS Object MetaObject nil
RAWCLASS Class      MetaClass Object      name parentClass methods size variables children
RAWCLASS MetaObject Class     Class
RAWCLASS MetaClass  Class     MetaObject
METHOD MetaObject
in: object at: index put: value
	" change data field in object, used during initialization "
	" returns the intialized object "
	<5 value object index>
!
METHOD Object
in: object at: index
	" browse instance variable via debugger "
	<24 object index>.
	self primitiveFailed
!
        `)
        expect(encoder.classes['MetaObject'].methods['in:at:put:'].bytecode).toEqual([35, 33, 34, 213, 245, 241])
        expect(encoder.classes['Object'].methods['in:at:'].bytecode).toEqual([33, 34, 13, 24, 245, 32, 129, 144, 0, 245, 241])
    })

});