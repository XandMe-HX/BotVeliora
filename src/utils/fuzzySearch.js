const stringSimilarity = require('string-similarity');
const { commands } = require('../handlers/commandLoader');

function findSimilarCommand(input) {
    const cmdList = Array.from(commands.keys());
    if (cmdList.length === 0) return null;
    
    const matches = stringSimilarity.findBestMatch(input, cmdList);
    if (matches.bestMatch.rating > 0.5) {
        return matches.bestMatch.target;
    }
    return null;
}

module.exports = { findSimilarCommand };
