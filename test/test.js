const should = require('chai').should;
const extractValue = require('../src/lib/extract');
const pick = require('../src/lib/pick');

describe('lambda-slack', () => {

  before(() => {
    should();
  });

  describe('Extracting values', () => {
    it ('returns correct value from object based on path defined with dot notation (and a preceding `$` symbol)', () => {
      const obj = {
        alpha: 'α',
        nested: {
          beta: 'β',
          deeper: {
            gamma: 'γ',
            evenDeeper: {
              delta: 'δ',
            },
          }
        },
      };
      extractValue(obj, '$.alpha').should.equal('α');
      extractValue(obj, '$.nested.beta').should.equal('β');
      extractValue(obj, '$.nested.deeper.gamma').should.equal('γ');
      extractValue(obj, '$.nested.deeper.evenDeeper.delta').should.equal('δ');
    });
  });

  describe('Picking notification', () => {
    it('picks notification without match rules', () => {
      const config = [{
        'name': 'Notification without match rules',
      }];
      const notification = pick({}, config);
      notification.should.be.an('object');
      notification.should.have.property('name');
      notification.name.should.equal('Notification without match rules');
    });
  });

});
