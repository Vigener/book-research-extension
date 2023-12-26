const userInput = "test　it";
var key_word = userInput.replace(/[\s　]/g, "+");
console.log(key_word);