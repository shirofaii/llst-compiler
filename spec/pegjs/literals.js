var parser = require('../../build/llst-method.js')

function parse(rule, text) {
    return parser.parse(text, {startRule: rule})
}

describe('llst literals grammar', function() {
    var parseNumber = text => parse('number', text)
    it('integers', function() {
        expect(parseNumber('123')).node('number')
        expect(parseNumber('123')).nodeWithValue(123)
        expect(parseNumber('0000')).nodeWithValue(0)
        expect(parseNumber('-2')).nodeWithValue(-2)
        expect(parseNumber('+2')).nodeWithValue(2)
        expect(parseNumber('+0')).nodeWithValue(0)
        expect(parseNumber('-0')).nodeWithValue(0)
        expect(parseNumber('02')).nodeWithValue(2)
        expect(parseNumber('1267650600228229401496703205376')).nodeWithValue(Math.pow(2, 100))
    });
    
    it('floats', function() {
        expect(parseNumber('123.0')).node('number')
        expect(parseNumber('123.0')).nodeWithValue(123.0)
        expect(parseNumber('0000.0000')).nodeWithValue(0)
        expect(parseNumber('-2.1')).nodeWithValue(-2.1)
        expect(parseNumber('+2.1')).nodeWithValue(2.1)
        expect(parseNumber('+0.0')).nodeWithValue(0)
        expect(parseNumber('-0.0')).nodeWithValue(0)
        expect(parseNumber('02.20')).nodeWithValue(2.2)
        expect(parseNumber('0.0101')).nodeWithValue(0.0101)
    });

});