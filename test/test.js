const { should } = require('chai');

const createVariables = require('../src/lib/variables');
const extractValue = require('../src/lib/extract');
const match = require('../src/lib/match');
const pick = require('../src/lib/pick');
const replace = require('../src/lib/replace');

describe('lambda-slack', () => {
  before(() => {
    should();
  });

  describe('Extracting values', () => {
    it('returns correct value from object based on path defined with dot notation (and a preceding `$` symbol)', () => {
      const obj = {
        alpha: 'α',
        nested: {
          beta: 'β',
          deeper: {
            gamma: 'γ',
            evenDeeper: {
              delta: 'δ',
            },
          },
        },
      };
      extractValue(obj, '$.alpha').should.equal('α');
      extractValue(obj, '$.nested.beta').should.equal('β');
      extractValue(obj, '$.nested.deeper.gamma').should.equal('γ');
      extractValue(obj, '$.nested.deeper.evenDeeper.delta').should.equal('δ');
    });

    it('throws error when path is defined without the preceding `$` symbol', () => {
      (() => { extractValue({}, 'alpha'); }).should.throw(Error);
    });
  });

  describe('Matching rules', () => {
    it('returns true for a single rule with a single value, matching', () => {
      const config = {
        '$.source': ['aws.codebuild'],
      };
      const payload = { source: 'aws.codebuild' };
      match(config, payload).should.equal(true);
    });

    it('returns false for a single rule with a single value, non-matching', () => {
      const config = {
        '$.source': ['aws.codepipeline'],
      };
      const payload = { source: 'aws.codebuild' };
      match(config, payload).should.equal(false);
    });

    it('returns true for a single rule with multiple values, one of them matching', () => {
      const config = {
        '$.source': ['aws.codebuild', 'aws.codepipeline'],
      };
      const payload = { source: 'aws.codebuild' };
      match(config, payload).should.equal(true);
    });

    it('returns false for a single rule with multiple values, none of them matching', () => {
      const config = {
        '$.source': ['aws.cloudwatch', 'foobar'],
      };
      const payload = { source: 'aws.codebuild' };
      match(config, payload).should.equal(false);
    });

    it('returns true for multiple rules, all of them matching', () => {
      const config = {
        '$.source': ['aws.codebuild', 'aws.codepipeline'],
        '$.detail-type': ['CodeBuild Build State Change'],
      };
      const payload = {
        source: 'aws.codebuild',
        'detail-type': 'CodeBuild Build State Change',
      };
      match(config, payload).should.equal(true);
    });

    it('returns false for multiple rules, not all of them matching', () => {
      const config = {
        '$.source': ['aws.codebuild', 'aws.codepipeline'],
        '$.detail-type': ['CodeBuild Build State Change'],
      };
      const payload = {
        source: 'aws.codebuild',
        'detail-type': 'CodeBuild Build Phase Change',
      };
      match(config, payload).should.equal(false);
    });

    it('throws error when value in match rule is not wrapped in an array', () => {
      const config = [{
        match: {
          '$.source': 'aws.codebuild',
        },
      }];
      (() => { pick(config, {}); }).should.throw(Error);
    });
  });

  describe('Picking notification', () => {
    it('picks notification without match rules', () => {
      const config = [{
        name: 'Notification without match rules',
      }];
      const notification = pick(config, {});
      notification.should.be.an('object');
      notification.should.have.property('name');
      notification.name.should.equal('Notification without match rules');
    });

    it('picks matching notification with a sole single-value match rule', () => {
      const config = [{
        name: 'Build Notification',
        match: { '$.source': ['aws.codebuild'] },
      }];
      const payload = { source: 'aws.codebuild' };
      const notification = pick(config, payload);
      notification.should.be.an('object');
      notification.should.have.property('name');
      notification.name.should.equal('Build Notification');
    });

    it('does not pick non-matching notification', () => {
      const config = [{
        match: { '$.source': ['aws.codepipeline'] },
      }];
      const payload = { source: 'aws.codebuild' };
      const notification = pick(config, payload);
      notification.should.be.a('boolean');
      notification.should.equal(false);
    });

    it('picks matching notification with a multi-value match rule', () => {
      const config = [{
        name: 'Build Notification',
        match: {
          '$.source': ['aws.codebuild', 'aws.codepipeline'],
        },
      }];
      const payload = { source: 'aws.codebuild' };
      const notification = pick(config, payload);
      notification.should.be.an('object');
      notification.should.have.property('name');
      notification.name.should.equal('Build Notification');
    });

    it('does not pick notification when not all match rules are fulfilled', () => {
      const config = [{
        name: 'Build Notification',
        match: {
          '$.source': ['aws.codebuild', 'aws.codepipeline'],
          '$.detail-type': ['CodeBuild Build State Change'],
        },
      }];
      const payload = {
        source: 'aws.codebuild',
        'detail-type': 'CodeBuild Build Phase Change',
      };
      const notification = pick(config, payload);
      notification.should.be.a('boolean');
      notification.should.equal(false);
    });

    it('skips non-matching notification and picks notification that matches', () => {
      const config = [
        {
          name: 'Build Phase Notification',
          match: {
            '$.source': ['aws.codebuild'],
            '$.detail-type': ['CodeBuild Build Phase Change'],
          },
        },
        {
          name: 'Build State Notification',
          match: {
            '$.source': ['aws.codebuild'],
            '$.detail-type': ['CodeBuild Build State Change'],
          },
        },
      ];
      const payload = {
        source: 'aws.codebuild',
        'detail-type': 'CodeBuild Build State Change',
      };
      const notification = pick(config, payload);
      notification.should.be.an('object');
      notification.should.have.property('name');
      notification.name.should.equal('Build State Notification');
    });

    it('picks first notification when there are multiple matching ones', () => {
      const config = [
        {
          name: 'Build Notification — first',
          match: {
            '$.source': ['aws.codebuild', 'aws.codepipeline'],
          },
        },
        {
          name: 'Build Notification — second',
          match: {
            '$.source': ['aws.codebuild'],
          },
        },
      ];
      const payload = { source: 'aws.codebuild' };
      const notification = pick(config, payload);
      notification.should.be.an('object');
      notification.should.have.property('name');
      notification.name.should.equal('Build Notification — first');
    });
  });

  describe('Creating variables', () => {
    it('creates variables from simple path definitions', () => {
      const config = {
        status: '$.detail.build-status',
        project: '$.detail.project-name',
      };
      const payload = {
        detail: {
          'build-status': 'IN_PROGRESS',
          'project-name': 'lambda-slack',
        },
      };
      const variables = createVariables(config, payload);
      variables.should.be.an('object');
      variables.should.eql({ status: 'IN_PROGRESS', project: 'lambda-slack' });
    });

    it('creates variables from definitions with match rules', () => {
      const config = {
        color: {
          green: {
            match: {
              '$.detail.build-status': ['IN_PROGRESS', 'SUCCEEDED'],
            },
          },
          red: {
            match: {
              '$.detail.build-status': ['FAILED'],
            },
          },
          yellow: {
            match: {
              '$.detail.build-status': ['STOPPED'],
            },
          },
        },
      };
      const payload = {
        detail: { 'build-status': 'IN_PROGRESS' },
      };
      const variables = createVariables(config, payload);
      variables.should.be.an('object');
      variables.should.eql({ color: 'green' });
    });

    it('throws error when definition of a variable is not a string or an object', () => {
      const config = [{
        project: ['foo'],
      }];
      (() => { match(config, {}); }).should.throw(Error);
    });
  });

  describe('Replacing variables', () => {
    it('correctly replaces variables in an object', () => {
      const config = {
        attachments: [{
          pretext: 'New build for <project>.',
          fields: [
            {
              title: 'Status',
              value: '<status>',
            },
            {
              title: 'Build ID',
              value: '<build-id>',
            },
          ],
        }],
      };
      const variables = {
        project: 'lambda-slack',
        'build-id': '1x2y3z4',
        status: 'SUCCEEDED',
      };
      const replacedConfig = replace(config, variables);
      replacedConfig.should.eql({
        attachments: [{
          pretext: 'New build for lambda-slack.',
          fields: [
            {
              title: 'Status',
              value: 'SUCCEEDED',
            },
            {
              title: 'Build ID',
              value: '1x2y3z4',
            },
          ],
        }],
      });
    });
  });
});
