/* Advanced Options */
// const TEXT_INPUT_SELECTOR = `[contenteditable="true"]`;
const debug = false;

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		// console.log("Hello. This message was sent from scripts/inject.js", $);
		// ----------------------------------------------------------

		function cancelCountdownTimer() {
			do_callback = false;
			window.clearInterval(window.__timer);
			document.getElementById('myTimer').innerHTML = '';
			document.getElementById('pink-halo').setAttribute("stroke-dasharray", 0 + ", 361");
		}

		var do_callback = false;
		var response_count = document.querySelectorAll('div.markdown.prose').length || 0;
		var latest_response = '';

		function doCountdownThen(cb) {
			do_callback = true;
			(function () {
			    var circle = document.getElementById('pink-halo');
			    var myTimer = document.getElementById('myTimer');
			    var t = 5;
			    var interval = 30;
			    var angle = 0;
			    var angle_increment = 360 / t;
			    var intervalCounter = 0;
			  
			    window.__timer = window.setInterval(function () {
			      intervalCounter ++;    
			        circle.setAttribute("stroke-dasharray", angle + ", 361");
			     
			        myTimer.innerHTML = t - parseInt((angle / 360) * t);

			        if (angle >= 360) {
			            window.clearInterval(window.__timer);

			            if (cb && do_callback) {
			            	cancelCountdownTimer();
			            	do_callback = false;
			            	cb();
			            }
			        }

			      angle += angle_increment / (1000 / interval);
			    }.bind(this), interval);
			})()
		}

		window.artyom = new Artyom();

		window.__last_transcribed_text = '';

		var _say = function(){};

		// artyom.fatality();
		// setTimeout(function(){}, 250);

		artyom.initialize({
		    // lang: "en-US", // GreatBritain english
		    continuous: true, // Listen forever
		    soundex: true,// Use the soundex algorithm to increase accuracy
		    debug: true, // Show messages in the console
		}).then(() => {
			artyom.say("Welcome!");

			_say = function(s) { artyom.say(s) };

			var UserDictation = artyom.newDictation({
			    continuous: true, // Enable continuous if HTTPS connection
			    onResult: function(text){
			        // Do something with the text
			        // console.log('text detected', text);
			        if (text && text.trim()) window.__last_transcribed_text = text;

			        clearTimeout(window._transcription_finished_timeout);
			        window._transcription_finished_timeout = setTimeout(() => {

			        	if (window.__last_transcribed_text) {
				        	if (debug) console.log('text finished:', window.__last_transcribed_text);
				        	$('textarea[tabindex="0"]').val(window.__last_transcribed_text);
				        	doCountdownThen(() => {
				        		if (debug) console.warn('Submitting form..');
				        		document.querySelector('form button.absolute').click()
				        	});

				        	$.post(`https://api.indie.am/punctuator`, { text: window.__last_transcribed_text }, function (resp) {
		                        if (resp.message) {
		                        	if (debug) console.log('punctuation:', resp.message);
		                        	cancelCountdownTimer();
		                        	$('textarea[tabindex="0"]').val(resp.message);
		                        	doCountdownThen(() => {
						        		if (debug) console.warn('Submitting form..');
						        		document.querySelector('form button.absolute').click()
						        	});
		                        }
		                    });

				        	window.__last_transcribed_text = '';
			        	}


			        }, 999);
			    },
			    onStart:function(){
			        if (debug) console.warn("Dictation started by the user");

					_say = function(s) { artyom.say(s) };
			    },
			    onEnd:function(){
			        if (debug) console.warn("Dictation stopped by the user");
			    }
			});

			UserDictation.start();
		});

		setInterval(() => {

			if (!$('.__countdown_timer').length) {
				$('textarea[tabindex="0"]').after(`<div class="__countdown_timer" title="click to cancel..">
				  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 300 300" preserveAspectRatio="none" style="width:64px; height:64px; top:0; left:0;">
				    <circle cx="100" cy="100" r="57" id="pink-halo" fill="none" stroke="#fd256e" stroke-width="10" stroke-dasharray="0, 361" transform="rotate(-90,100,100)" />
				    <text id="myTimer" text-anchor="middle" x="100" y="120" style="font-size: 64px; fill:#fff;"></text>
				</svg>
				</div>`);
				$('.__countdown_timer, .__countdown_timer svg').click(function(){
					if (debug) console.warn('cancelling countdown timer');
					cancelCountdownTimer();
				});
			}

			// Look for new responses
			if (document.querySelectorAll('div.markdown.prose').length > response_count && document.querySelectorAll('form button.flex').length) {
				response_count = document.querySelectorAll('div.markdown.prose').length;

				// Do something
				latest_response = document.querySelectorAll('div.markdown.prose')[response_count - 1].textContent;

				if (debug) console.warn('New Response detected!', latest_response);

				// Say it!
				// UserDictation.stop();
				_say(latest_response);
				// UserDictation.start();

			}

		}, 222);

	}
	}, 10);
});
