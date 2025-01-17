import * as sinon from "sinon";
import { expect } from "chai";
import Pipeline from "../../lib/pipeline";
import Commander from "../../lib/commander";
import Redis from "../../lib/redis";

describe("Pipeline", function() {
  beforeEach(() => {
    sinon.stub(Redis.prototype, "connect").resolves();
    sinon.stub(Commander.prototype, "sendCommand").callsFake(command => {
      return command;
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should properly mark commands as transactions", function() {
    const redis = new Redis();
    const p = new Pipeline(redis);
    let i = 0;

    function validate(name, inTransaction) {
      const command = p._queue[i++];
      expect(command.name).to.eql(name);
      expect(command.inTransaction).to.eql(inTransaction);
    }

    p.get();
    p.multi();
    p.get();
    p.multi();
    p.exec();
    p.exec();
    p.get();

    validate("get", false);
    validate("multi", true);
    validate("get", true);
    validate("multi", true);
    validate("exec", true);
    validate("exec", false);
    validate("get", false);
  });

  it("should properly set pipelineIndex on commands", function() {
    const redis = new Redis();
    const p = new Pipeline(redis);
    let i = 0;

    function validate(name) {
      const command = p._queue[i];
      expect(command.name).to.eql(name);
      expect(command.pipelineIndex).to.eql(i);
      i++;
    }

    p.get();
    p.set();
    p.del();
    p.ping();

    validate("get");
    validate("set");
    validate("del");
    validate("ping");
  });
});
