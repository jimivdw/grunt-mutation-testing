/**
 * Created by martin on 25/03/15.
 */
describe('Endless Loop', function () {

    it('tests to see whether mutations cause code to loop indefinitely', function () {
        provokeEndlessLoop({input: '102365770045232'});
    });

});
