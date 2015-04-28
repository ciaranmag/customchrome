var extBlock;
var state;
var nameArray = [];
var allObjects = [];
var extArray = [];
var activeExtensions = [];
var inactiveExtensions = [];

// Handlebars.js
var source   = $("#entry-template").html();
var template = Handlebars.compile(source);

// function for listening for checkbox changes
// disables/enables extension depending on current state
// also re-writes $('.state')'s text to reflect the change
var g;
var checkboxListener = function(){
  $('.extToggle input').change(
    function(){
      g = $(this);
      var appCode = g.attr('appid'); //we set the appid as an attribute in our handlebars template at the end of popup.html
      console.log('The app being changed id = '+ appCode); //for debugging and clarity
      console.log('checking this.prop: '+ g.prop('checked')); //for debugging and clarity

      if(g.prop('checked')){
        //app is active, disable extension - eh this is being mirrored for some reason, asynchronous-ness messing stuff up maybe? works anyway
        chrome.management.setEnabled(appCode, true, function (){
          console.log('Turning appid '+appCode+ ' on'); //toggling the extension state and
          g.parent().siblings(".state").text('on'); //re-entering the text in .state
        });
      }else {
        //app is off, turn on - as above, this is being mirrored for some reason. working tho...
        chrome.management.setEnabled(appCode, false, function (){
          console.log('Turning appid '+appCode+ ' off');
          g.parent().siblings(".state").text('off');
        });
      }
    }
  );
};

$(document).ready(function(){
    
    //Getting extensions and adding them to list
    chrome.management.getAll(function(info) {
      
      // data is coming inside a big array (info)
      console.log(info);

      //Need to filter out apps and only keep extensions
      info.forEach(function(entry) { 
        if(entry.type === "extension"){
          extArray.push(entry);
        }
      })


      extArray.forEach(function(entry) { //cycle through each entry
      // console.log(entry);

      //push each extension name to an array (nameArray) - no reason as of yet....
      nameArray.push(entry.name);

      //extension icons are stored in an array (entry.icons), but not all extensions have icons.
      if(entry.icons === undefined){
        imgsrc = 'icon-128.png'  //and if there aren't any icons, we set a default
      }else {
        //and if there are indeed an array of icons, we want to take the
        //highest res one (which is going to be the last one in the array)
        //so we check for the array length, and then use that value (-1) to get the array item we want
        //then we set that item's url as our app icon url
        var iconCount = entry.icons.length; 
        // console.log('number of icons found: '+iconCount);
        imgsrc = entry.icons[iconCount-1].url;
      }

      entry.pic = imgsrc; //setting the url we got earlier as the entry.pic
      entry.state = state; //setting the state we got earlier as the entry.state

      // console.log('appId is: '+entry.id); //for debugging

      // console.log('imgsrc is: '+imgsrc); //for debugging

      // $('#extensions').append(template(entry)); //append each of our entries to our template to the #extensions div. 
      

			// I want to create two separate lists of active (on) and inactive (off) extensions so I can then divide them up into groups in the HTML output
			// get current state of ext (if it's on or off) and apply that to the checkbox. also changing "true" to 'on' and 'false' to 'off'
      state = entry.enabled;
      if (state) {
      	// state = 'on';
        entry.checkbox = "checked";
        $('#activeExtensions').append(template(entry));
      } else {
      	// state = 'off';
        entry.checkbox = '';
        $('#inactiveExtensions').append(template(entry));
      }
      
    });

      checkboxListener(); //run the function which listens for a change in a checkbox state
      // console.log(nameArray); -- was console loggin names for search feature
    });


  //Search Functionality:

    $("#searchbox").keyup(function(){
 
        // Retrieve the input field text
        var filter = $(this).val();
 
        // Loop through the extensions list
        $(".extName").each(function(){
            var h = $(this).parents('.extBlock'); //setting h as the extension's holder (for use later)

            // If the extension name doesn't match the characters, fadeout the extBlock of that extension (see above)
            if ($(this).text().search(new RegExp(filter, "i")) < 0) { //searching extName for the #searchboxes contents
                h.fadeOut(); //fade the parent div out if no match found
 
            // Show the list item if the phrase matches
            } else {
                h.fadeIn();
            }
        });
 
    });    
});

alwaysOnBtn.addEventListener('click', function(){
if ($(this).hasClass("enabled")) {
	profile1args.forEach(function(arg) {
		chrome.management.setEnabled(arg, false, function (){
	    console.log('Turning ' +arg+ ' off');
	    extArray[63].enabled = false;
	    extArray[63].checkbox = "";
		});
	});
} else if ($(this).hasClass("disabled")) {}
	profile1args.forEach(function(arg) {
		chrome.management.setEnabled(arg, true, function (){
	    console.log('Turning Reddit on');
	    extArray[63].enabled = true;
	    extArray[63].checkbox = "checked";
		});
	});
  checkboxListener();
});

// Changes the state of a profile button to show if it's in on or off mode
$(".profile-btn").click(function(){
	if ($(this).hasClass("enabled")) {
		$(this).removeClass("enabled");
		$(this).addClass("disabled");
	}
	else if ($(this).hasClass("disabled")) {
		$(this).removeClass("disabled");
		$(this).addClass("enabled");
	};
});


var profile1args = ["kbmfpngjjgdllneeigpgjifpgocmfgmb"];
var profile2args = [];

for (var i = 0, len = extArray.length; i < len; i++) {
  if (extArray[i].id === profile1args[0]) {
  	console.log("Extension name: " + extArray[i].name);
  };
};



// extension.toggle(state); // change state back to true/false first



// chrome.management.setEnabled("kbmfpngjjgdllneeigpgjifpgocmfgmb", false, function (){
//   console.log('Turning appid Reddit off');
// });
// extArray.forEach(function(extension){
// 	if (extension.id === "kbmfpngjjgdllneeigpgjifpgocmfgmb") {
// 		extension.checkbox = ''
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






