const should = require('chai').should;
const pick = require('../src/lib/pick');
should();

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
