/*		This contains all event listeners to make the page function as expected.		*/

// Keep track of which log is being processed
document.requestLogs = true;

// Work the "change input" button
document.getElementById('change-input').addEventListener('click', function () {
		console.log('ok');
		document.requestLogs = !document.requestLogs;
		// Change title text
		document.getElementById('input-title').innerHTML = 'Input '+(document.requestLogs ? 'Request' : 'Response')+' Logs';
		// Change button text
		document.getElementById('change-input').innerHTML = 'Change to '+(document.requestLogs ? 'Response' : 'Request')+' Parsing';
});

// Work the "submit" button
document.getElementById('submit').addEventListener('click', function() {
		var inputText = document.getElementById('input-text').value;
		
		var outputText = parseRequestResponse(document.requestLogs, inputText);

		document.getElementById('output-text').value = outputText;
});


// Actually handle the log parsing
function parseRequestResponse(requestsOnly, inputText) {
		console.log(requestsOnly);
		var logs = inputText.split('\n');

		if (requestsOnly) {
				// Extract calls from the request format
				var calls = logs.map(function(log) {
						// Break the line into words
						var req = log.split(' ');

						return req.filter(function(part) {
								// Only consider words that are key=value pairs
								return part.indexOf('=') !== -1
						}).reduce(function(obj, keyVal){
								// Break apart keys & values
								keyVal = keyVal.split('=');
							  var key = keyVal[0],
							  val = keyVal[1];
							  // Store them in the object
								obj[key]=val;
								// Return an object for each log
								return obj
						}, {})
				});
		} else {
				// Extract calls from the response format
				var calls = logs.map(function(log) {
						// Grab just the requestData object
						var req = log.substring(log.indexOf('requestData='),log.length);
						// Turn it into something we can parse into a javascript object
						req = req.substring(req.indexOf('{'),req.indexOf('}')+1);
						// Do that
						try {
								var callObj = JSON.parse(req);
		    		} catch (e) {
							  var callObj = {"callId": "thisOneSucks"};
		    		}
						callObj.log = log;
						// Return the results
						return callObj
				});
		}

		// Print it like a CSV
		var output = calls.reduce(function(output,call){
				return output+'\n'+(requestsOnly ? call.ucid : call.callId)+","+(call.dnis?call.dnis:"")+","+(call.ani?call.ani:"")
		},"callId,dnis,ani");

		return output
}