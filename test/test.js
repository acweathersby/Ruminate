import chai from "chai";
import graze from "../source/graze.js";

chai.should();

it("warning: empty test", function(){
	graze.should.not.be.undefined;
})
