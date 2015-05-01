var extArray = [];
var activeExtensions = [];
var inactiveExtensions = [];
var profilesHolder = {};
var profile1 = [];
var profile2 = [];
var profile3 = [];
var profile4 = [];
var profile5 = [];

// Handlebars.js
var source   = $("#entry-template").html();
var template = Handlebars.compile(source);

$(document).ready(function(){
	chrome.management.getAll(function(info) {
		// info is a list of all user installed apps, extensions etc push extensions to extArray
		info.forEach(function(entry) {
			if(entry.type === "extension"){
				extArray.push(entry);
			}
		})

		// Sort extArray in alphabetical order based on the extension's name
		extArray.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});

		extArray.forEach(function(entry) {
			// extension icons are stored in entry.icons, but not all extensions have icons
			if (entry.icons === undefined) {
				imgsrc = 'icon-128.png'  // if there aren't any icons, set a default
			} else {
				// and if there is an array of icons, we want the highest res one (which is going to be the last one in the array) so find the array length, then use that value (-1) to get the last icon then set that item's url as our app icon url
				imgsrc = entry.icons[entry.icons.length-1].url;
			}
			entry.pic = imgsrc; // setting the url we got earlier as entry.pic

			// divide the extensions into two separate lists of active (enabled = true) and inactive (enabled = off) and output them into the appropriate HTML div
			if (entry.enabled) {
				$('#activeExtensions').append(template(entry));
			} else {
				$('#inactiveExtensions').append(template(entry));
			}
		});

		extStateListener(); // run the function which listens for a change in a checkbox state
		
		// These profiles can't reference extArray permanently because if a user installs/uninstalls extensions these extensions will change places in the extArray array
		profile1 =[
			extArray[0],
			extArray[1],
			extArray[2],
			extArray[3]
		];

		profile2 =[
			extArray[4],
			extArray[5],
			extArray[6],
			extArray[7]
		];

		profile3 =[
			extArray[8],
			extArray[9],
			extArray[10],
			extArray[11]
		];

		profile4 =[
			extArray[12],
			extArray[13],
			extArray[14],
			extArray[15]
		];

		profile5 =[
			extArray[16],
			extArray[17],
			extArray[18],
			extArray[19]
		];

		profilesHolder = {
			"profile1": profile1,
			"profile2": profile2,
			"profile3": profile3,
			"profile4": profile4,
			"profile5": profile5
		};

		var sizeOfProfilesHolder = Object.keys(profilesHolder).length;

		for (var i = 0; i < sizeOfProfilesHolder-1; i++) {
			for (key in profilesHolder){
					// These numbers need to go through the size of each profile instead of being numbered
					if (profilesHolder[key][0]["enabled"] && profilesHolder[key][1]["enabled"] && profilesHolder[key][2]["enabled"] && profilesHolder[key][3]["enabled"]) {
						$("#" + key).addClass("on");
					} else{
						$("#" + key).addClass("off");
					}
			}
		};

		// Turning individual extensions on or off with a click
		$(".extId").hide();
		$(".extState").hide();

		$(".extBlock").click(function(){
			var theExtId = $(this).find(".extId").text();
			var theExtState = $(this).find(".extState");
			var theExtStateText = theExtState.text();
			var wholeExt = $(this);
			if (theExtStateText === "true") {
				chrome.management.setEnabled(theExtId, false, function (){
					theExtState.text("false");
					wholeExt.append(".inactiveExtensions");
					location.reload();
				});
			} 
			else if (theExtStateText === "false") {
				chrome.management.setEnabled(theExtId, true, function (){
					theExtState.text("true");
					wholeExt.append(".activeExtensions");
					location.reload();
				});
			};
		});
	});

// Search
	$("#searchbox").keyup(function(){
			// Retrieve the input field text
			var filter = $(this).val();
			// Loop through the extensions
			$(".extName").each(function(){
				var h = $(this).parents('.extBlock'); //setting h as the extension's holding div
				if ($(this).text().search(new RegExp(filter, "i")) < 0) { // searching extName for the #searchbox's contents if it doesn't match then fadeOut the holding div
					h.fadeOut(); //fade the parent div out if no match found
				} else {
					h.fadeIn(); // show the list item if the phrase matches
				}
			});
	});
	$('.searchbox').focus();
}); // close $(document).ready

// function which listens for checkbox changes and then disables/enables extension depending on the change requested
var g;
function extStateListener() {
	$('.extState').change(
		function(){
			g = $(this).parent(); // g is now set to the selected extension
			console.log(g);
			var appId = g.id; // set the appid as an attribute in our handlebars template at the end of popup.html ** changed g.attr('appid') to g.id - it should still work **
			if (g.enabled) {
				// app is active, disable extension - eh this is being mirrored for some reason, asynchronous-ness messing stuff up maybe? works anyway
				chrome.management.setEnabled(appId, true, function (){
					// SET SWITCH TO OFF HERE
				});
			} else {
				// app is off, turn on - as above, this is being mirrored for some reason. working tho...
				chrome.management.setEnabled(appId, false, function (){
					// SET SWITCH TO ON HERE
				});
			}
		}
	);
};

$("#profile1").click(function(){
	if ($(this).hasClass("on")) { // turn all off
		profile1.forEach(function(extensionObj){
			chrome.management.setEnabled(extensionObj.id, false, function (){});
		})
		$(this).removeClass("on");
		$(this).addClass("off");
	}
	else if ($(this).hasClass("off")) { // turn all on
		profile1.forEach(function(extensionObj){
			chrome.management.setEnabled(extensionObj.id, true, function (){});
		})
		$(this).removeClass("off");
		$(this).addClass("on");
	}
	location.reload();
});




// extension.toggle(enabled);


// chrome.management.setEnabled("kbmfpngjjgdllneeigpgjifpgocmfgmb", false, function (){
//   console.log('Turning appid Reddit off');
// });
// extArray.forEach(function(extension){
// 	if (extension.id === "kbmfpngjjgdllneeigpgjifpgocmfgmb") {
// 		console.log(extension.name);
// 	}
// });


// // Code to get current tab URL
// chrome.tabs.getSelected(null,function(tab) {
//     var tablink = tab.url;
// });
// // OR
// var tablink;
// chrome.tabs.getSelected(null,function(tab) {
//     tablink = tab.url;
// });
// // OR
// chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
//     var url = tabs[0].url;
// });

