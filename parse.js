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
		// Run parsing functions
		var calls = requestsOnly ? callsFromLogsReq(logs) : callsFromLogsRes(logs);

		// // Print it like a CSV
		// var outputFormat = "timestamp,ucid,dnis,ani,concertSessionId" + (requestsOnly ? "" : ",statusCode,tenantId,anonymousId,sessionId" )
		// var output = calls.reduce(function(output,call){
		// 		return output+'\n'+call.timestamp+","+(call.ucid||"")+","+(call.dnis||"")+","+(call.ani||"")+","+(call.concertSessionId||"")+(requestsOnly ? "" : ","+(call.status||"")+","+(call.tenantId||"")+","+(call.anonymousId||"")+","+(call.sessionId||""))
		// },outputFormat);

		// /*	Now we create a CSV output	*/
		// // Select the output columns
		// var outputFields = ["timestamp","ucid","dnis","ani","concertSessionId"]
		// // Add more for responses
		// if (!requestsOnly) {
		// 	Array.prototype.push.apply(outputFields, ["statusCode","tenantId","anonymousId","sessionId"])
		// } else {
		// 	// Nothing happens
		// }

		// // Establish the header row
		// var outputFormat = outputFields.reduce(function(columns,column,index) {
		// 	return columns+(index!==0?",":"")+column
		// }, "");

		// // Map it to an output
		// var outputString = calls.reduce(function(finalOutput,call) {
		// 	// Now we'll do some crazy shit to return each line of the CSV
		// 	return finalOutput+'\n'+outputFields.map(function(outputField) {
		// 		// Return an array of the call Object's value for each key specified in outputFields
		// 		return call[outputField] || ""
		// 	}).reduce(function(outputLine,callField,index) {
		// 		// Reduce this array to a comma separated string
		// 		return outputLine+(index!==0?",":"")+callField
		// 	},"")
			
		// }, outputFormat)

		return formatOutput(requestsOnly, calls)
}

// Extract calls from the request format
function callsFromLogsReq(logs) {
	return logs.map(function(log) {
		// Break the line into words
		var req = log.split(' ');

		var reqObj = req.filter(function(part) {
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
		// Rename session ID to be more specific
		reqObj.concertSessionId = reqObj.sessionId;
		delete reqObj.sessionId;
		// Reconstruct the timestamp
		reqObj.timestamp = req[0]+" "+req[6].replace(",",".");

		return reqObj
	});
}

// Extract calls from the response format
function callsFromLogsRes(logs) {
	return logs.map(function(log) {
			// Grab just the requestData object
			var req = log.substring(log.indexOf('requestData='),log.length);
			// Turn it into something we can parse into a javascript object
			req = req.substring(req.indexOf('{'),req.indexOf('}')+1).replace('callId','ucid');
			// Do that
			try {
					var callObj = JSON.parse(req);
  		} catch (e) {
  				console.log(req);
  				console.error(e);
				  var callObj = {"ucid": "thisOneSucks"};
  		}
			callObj.log = log;


			// Also get the response data
			var response = log.substring(log.indexOf('responseData=')+'responseData='.length,log.indexOf(',request'));
			try {
					var responseObj = JSON.parse(response);
					// Add response data to call Object
					callObj.tenantId = responseObj.tenantId || '';
					callObj.anonymousId = responseObj.anonymousId || '';
					callObj.sessionId = responseObj.sessionId || '';
					// Also get any Paid Search Permalease data
					if (responseObj.metadata) {
						callObj.adGroupName = responseObj.metadata.adGroupName || '';
						callObj.adGroupId = responseObj.metadata.adGroupId || '';
						callObj.searchProvider = responseObj.metadata.searchProvider || '';
						callObj.campaignName = responseObj.metadata.campaignName || '';
						callObj.campaignId = responseObj.metadata.campaignId || '';
					}
					console.log(callObj)
					// Add a successful response status if one was not logged
					callObj.statusCode = responseObj.status || '200';
			} catch (e) {
					console.log(response);
					console.error(e);
			}

			// Also get the timestamp, concert session ID, and concert user
			callObj.timestamp = log.split(' ').slice(0,2).join(' ').replace(',','.');	
			try {
				callObj.concertSessionId = log.match(/sessionId=\S+/)[0].replace('sessionId=','');
				callObj.concertUser = log.match(/user=\S+/)[0].replace('user=','');
			} catch(e) {
				console.error(e);
			}
			

			// Also get the IP addresses
			log.match(/[A-Za-z]+IpAddress="\d+\.\d+\.\d+\.\d+/g).forEach(function(match) {
					var keyVal = match.split('="');
					callObj[keyVal[0]] = keyVal[1];
			});

			// Return the results
			return callObj
	});
}

function formatOutput(requestsOnly, calls) {
		/*	Now we create a CSV output	*/
		// Select the output columns
		var outputFields = ["timestamp","ucid","dnis","ani","concertSessionId"]
		// Add more for responses
		if (!requestsOnly) {
			Array.prototype.push.apply(outputFields, ["statusCode","tenantId","anonymousId","sessionId","clientIpAddress","publicIpAddress", "concertUser", "adGroupId", "adGroupName", "campaignId","campaignName","searchProvider"])
		} else {
			// Nothing happens
		}

		// Establish the header row
		var outputFormat = outputFields.reduce(function(columns,column,index) {
			return columns+(index!==0?",":"")+column
		}, "");

		// Map it to an output
		return calls.reduce(function(finalOutput,call) {
			// Now we'll do some crazy shit to return each line of the CSV
			return finalOutput+'\n'+outputFields.map(function(outputField) {
				// Return an array of the call Object's value for each key specified in outputFields
				return call[outputField] || ""
			}).reduce(function(outputLine,callField,index) {
				// Reduce this array to a comma separated string
				return outputLine+(index!==0?",":"")+callField
			},"")
			
		}, outputFormat)
}