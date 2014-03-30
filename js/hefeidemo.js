var slowTid,fastTid;
var pollDelay = 60000;
var pollFastDelay = 10000;
var tempMin = 20;
var tempMax = 25;
var tempBuff = 1;
var clsNormal = 'normal';
var clsWarnCold = 'warn-cold';
var clsCritCold = 'critical-cold';
var clsWarnHot = 'warn-hot';
var clsCritHot = 'critical-hot';
var regionDims = {};
var imageDims = {'x': $('#img-main-floor').width(),'y': $('#img-main-floor').height()};

var currentAttribute = 'temperature.celsius';

var chart = null;

var divClasses = {};

var colorLightOn = 'yellow';
var colorLightOff = '#333';

var ageAlertDiv = '<div class="temp-value-alert"><img src="img/clock-basic.png" width="32" height="32" title="Reading is more than 5 minutes old" alt="Reading is more than 5 minutes old."/></div>';
var firstLoad = true;

var doorLocations = {
	'119': {'left': '200px', 'top': '560px'}
};

var tempLocations = {
	'float': {'left': '0px', 'top': '-3em'}
};

var lightLocations = {
	'119': {'left': '210px', 'top': '410px'}
};

var lightDivs = {};
var doorDivs = {};

var hasLight = {};


var tempClass = function(temp) {
	if(temp > tempMax){
		return clsCritHot;
	}
	if(temp > tempMax-tempBuff){
		return clsWarnHot;
	}
	if(temp < tempMin){
		return clsCritCold;
	}
	if(temp < tempMin+tempBuff){
		return clsWarnCold;
	}
	return clsNormal;
}

var chartOptions = {
	labels: ['Date','Temperature'],
	valueRange: [tempMin,tempMax],
	strokeWidth: 2.0,olors: ['black']
};

var chartReady = false;
var chartDiv = $('#temp-chart');
var chartList = $('#chart-range-list');
var chartHeader = $('#temp-chart-head');
var currentId = null;
var chartLinkHour = $('#chart-range-hour');
var chartLinkHalfDay= $('#chart-range-12hour');
var chartLinkDay = $('#chart-range-day');
var chartLinkWeek = $('#chart-range-week');
var chartLinkMonth = $('#chart-range-month');
var unHide = true;
var oneHour = {val: 3600000, text: 'One Hour'};
var twelveHours = {val: 43200000, text: '12 Hours'};
var oneDay = {val: 86400000, text: '24 Hours'};
var oneWeek = {val: 604800000, text: '7 Days'};
var fourWeeks = {val: 2419200000, text: '4 Weeks'};
var ageAlertTime = 1800000;
var names = {};

var $mainImgDiv = $('#image-container');

var timeAlertDivs = {};
var lastUpdateTs = {};

var markChartLoaded = function (){
	chartReady = true;
}

var main = function() {

	var $legendImg = $('#legend-container');
	$legendImg.click(function(evt){
		evt.preventDefault();
		$('#legend-container').toggle();
	});

	var $legendLink = $('#legend-click');
	$legendLink.click(function(evt){
		evt.preventDefault();
		$('#legend-container').toggle();
	});

	//
	pollSlow();
	slowTid = setInterval(pollSlow,pollDelay);
/*	fastTid = setInterval(pollFast,pollFastDelay); */
	chartLinkHour.click(function(evt){
		evt.preventDefault();
		showChart(currentId,oneHour);});
	chartLinkHalfDay.click(function(evt){
		evt.preventDefault();
		showChart(currentId,twelveHours);});
	chartLinkDay.click(function(evt){
		evt.preventDefault();
		showChart(currentId,oneDay);});
	chartLinkWeek.click(function(evt){
		evt.preventDefault();
		showChart(currentId,oneWeek);});
	chartLinkMonth.click(function(evt){
		evt.preventDefault();
		showChart(currentId,fourWeeks);});

//	chartHeader.addClass('invisible');
//	chartDiv.addClass('invisible');
}

var pollSlow = function() {
	$.getJSON("http://210.45.250.3:7011/grailrest/snapshot?q=region.Hefei&a=location.*&cb=?",
			function(data){
				updateRegion(data);
			$.getJSON("http://210.45.250.3:7011/grailrest/snapshot?q=Hefei.*&a=location.*&cb=?",
				function(data){
					updateLocations(data);
				});
			$.getJSON("http://210.45.250.3:7011/grailrest/snapshot?q=Hefei.*&a=temperature.celsius&cb=?",
				function(data){
					updateTemp(data);
				});
			if(firstLoad){
				firstLoad = false;
				/*pollFast();*/
			}
			});
	$.getJSON("http://210.45.250.3:7011/grailrest/snapshot?q=Hefei.*&a=displayName&cb=?",
			function(data){
				updateNames(data);
		});
}

var pollFast = function() {
	$.getJSON("http://210.45.250.3:7011/grailrest/snapshot?q=Hefei.*&a=closed&cb=?",
			function(data){
				updateDoors(data);
			});
}

var updateDoors = function(attributesArr){
	if(attributesArr != null){
		$.each(attributesArr, function(index, value){
			var ts = new moment(value.attributes[0].creationDate).toDate();
			var id = value.identifier.split('.')[2];
			lastUpdateTs['door-'+id] = ts;
			var closed = value.attributes[0].data;
			var room = rooms[id];
			if(room == null){
				return ;
			}
			var doorLocation = doorLocations[id];
			var $div = doorDivs[id];

			// Situation 1: Create new div, add to map
			if($div  == null){
				var positionXY = doorLocations[room];
				if(positionXY != null){
					$div = $('<div class="door-sensor" id="door-'
						+id
						+'"><a href="javascript:" id="door-link-'+id+'"><img class="door-image" id="door-img-'+id+'" src="img/door_closed.png" alt="Door is closed" title="Door is closed" /></a></div>');
					doorDivs[id] = $div;
					$div.appendTo($mainImgDiv);
					$.each(positionXY, function(index, value){
						$div.css(index,value);
					});
					$('#door-link-'+id).click(function(evt){
						evt.preventDefault();
/*						showDoorChart(id,oneWeek); */
					});
				}
			}

			var $img = $('#door-img-'+id);
			// closed
			if(closed == "true"){

				$img.attr('src','img/door_closed.png');
				$img.attr('alt','Door is closed');
				$img.attr('title','Door is closed');
			}
			// open
			else{
				$img.attr('src','img/door_open.png');
				$img.attr('alt','Door is open');
				$img.attr('title','Door is open');
			}
		});
/*		var now = new Date().getTime();
		$('.door-sensor').each(function(index,value){
			var lastUp = lastUpdateTs[value.id];
			if(lastUp != null){
				var age = now - lastUp;
				if(age >ageAlertTime){
					if(timeAlertDivs[value.id] == null){
					timeAlertDivs[value.id] = $(ageAlertDiv);
					timeAlertDivs[value.id].appendTo($('#'+value.id));
					}
				}else {
					$('#'+value.id).children('.temp-value-alert').remove();
					timeAlertDivs[value.id] = null;
				}
			}
		});
		*/
	}
}

var updateNames = function(attributesArr){

	if(attributesArr != null){
		$.each(attributesArr, function(index, value){
			var id = value.identifier.split('.')[2];
			var name = value.attributes[0].data;
			names[id] = name;
		});
	}
}

var updateRooms = function(attributesArr){
	if(attributesArr != null){
		$.each(attributesArr, function(index, value){
			var id = value.identifier.split('.')[2];
			var room = value.attributes[0].data;
			rooms[id] = room;
		});
	}
}

var updateRegion = function(attributesArr){
	if(attributesArr != null){
		$.each(attributesArr, function(index, value){
			var ts = new moment(value.attributes[0].creationDate).toDate();
			var id = value.identifier;
			$.each(value.attributes, function(aIdx, aValue){
				if("location.maxx" == aValue.attributeName){
					regionDims['x'] = aValue.data;
				}
				else if("location.maxy" == aValue.attributeName){
					regionDims['y'] = aValue.data;
				}
			});
		});
	}
}

var updateTemp = function(attributesArr){
	var now = new Date().getTime();
	if(attributesArr != null){
		$.each(attributesArr, function(index, value){
			var id = value.identifier.replace(/\./g,"-");
			if(id.indexOf("receiver") >= 0){
				return;
			}
			var temp = Math.round(value.attributes[0].data);
			var ts = new moment(value.attributes[0].creationDate).toDate();


			var $div = $('#temp-'+id);
			// Haven't created the temperature value div yet
			if(!$div.length){
				// Create the div
				$div = $('<div id="temp-'+id+'" class="temp-value"></div>');
				$div.appendTo($mainImgDiv);
				// Now position the div
				var positionXY = tempLocations[id];
				if(positionXY != null){
					$.each(positionXY, function(index, value){
						$div.css(index,value);
					});
				}
			}
			var $anchor = $('#a-'+id);
			// Haven't created the temperature link (for chart) yet.
			if(!$anchor.length){
				$anchor = $('<a href="#temp-chart" id="a-'+id+'"></a>');
				$anchor.appendTo($div);
				$anchor.click(function(evt){showTempChart(id)});
			}
			$anchor.text(temp);
			var colorClass = tempClass(temp);
			var prevClass = divClasses[id];
			if(typeof prevClass !== 'undefined'){
				$div.removeClass(prevClass);
			}
			$div.addClass(colorClass);
			divClasses[id] = colorClass;
			lastUpdateTs['temp-'+id] = ts;
		});

		$('.temp-value').each(function(index,value){
			var lastUp = lastUpdateTs[value.id];
			if(lastUp != null){
				var age = now - lastUp;
				if(age >ageAlertTime){
					if(timeAlertDivs[value.id] == null){
					timeAlertDivs[value.id] = $(ageAlertDiv);
					timeAlertDivs[value.id].appendTo($('#'+value.id));
					}
				}else {
					$('#'+value.id).children('.temp-value-alert').remove();
					timeAlertDivs[value.id] = null;
				}
			}
		});
	}

}
var updateLocations = function(attributesArr){
	var now = new Date().getTime();
	if(attributesArr != null){
		$.each(attributesArr, function(index, value){
			var id = value.identifier.replace(/\./g,"-");
			if(id.indexOf("receiver") >= 0){
				return;
			}
			var temp = Math.round(value.attributes[0].data);
			var ts = new moment(value.attributes[0].creationDate).toDate();
			$.each(value.attributes,function(aIndex, aValue){
				if(typeof tempLocations[id] == 'undefined'){
					tempLocations[id] = {};
				}
				if("location.xoffset" == aValue.attributeName){
					tempLocations[id]['left'] = 60+Math.round(aValue.data * (imageDims['x']/regionDims['x']));
				}
				else if ("location.yoffset" == aValue.attributeName){
					tempLocations[id]['top'] = Math.round(imageDims['y'] - 20-(aValue.data * (imageDims['y']/regionDims['y'])));
				}
		
			});
		});
	}
}

var showLightChart = function(sensorId,timePeriod){
	currentAttribute = 'light level';
	showChart(sensorId,timePeriod);
}

var showTempChart = function(sensorId,timePeriod){
	currentAttribute='temperature.celsius';
	showChart(sensorId,timePeriod);
}

var showChart = function(sensorId,timePeriod) {
	currentId = sensorId;
	if(timePeriod == null){
		timePeriod = oneWeek;
	}
	var now = (new Date()).getTime();

	var earliest = now - oneDay.val;
	if(timePeriod != null){
		earliest = now - timePeriod.val;
		if(timePeriod.val <= oneHour.val){
			// Options ?
		}
		else if(timePeriod.val <= oneDay.val){
			// Options ?
		}
		else {
			// Options ?
		}
	}
	if(unHide){
		unHide = false;
		chartHeader.removeClass('invisible');
		chartList.removeClass('invisible');
		chartDiv.removeClass('invisible');
		$('#temp-chart-tips').removeClass('invisible');
	}
	var name = names[sensorId];
	if(name == null){
		name = 'Sensor ' + sensorId;
	}
	NProgress.start();
	var dataType = 'light level' === currentAttribute ? 'Light' : 'Temperature';
	chartHeader.text(dataType + " for " + name + ' - ' + timePeriod.text);
	var wmId = sensorId.replace(/-/g,".");
	$.getJSON("http://210.45.250.3:7011/grailrest/range?q="+wmId+"&a="+currentAttribute+"&st="+earliest+"&et="+now+"&cb=?",
		function(data){
			if(data.length){
				NProgress.set(.1);
				renderChart(data[0],chartOptions);
			}else{
				NProgress.done();
			}
		});
}

var renderChart = function(history, options){
	var identifier;
//	var now = (new Date()).getTime();
//	var dayAgo = now - 24*60*60*1000;
		var minTemp = tempMin;
		var maxTemp = tempMax;

			var chartData = [];
			// For light pie chart
			var byHour = [];

			$.each(history, function(index, value){
				NProgress.inc();
				if(index === 'identifier'){
					identifier = value;
				}else if(index === 'attributes'){
					$.each(value, function(idx, attr){
						

						var t =attr.data;//*1.8+32;
						if('temperature.celsius' === currentAttribute){
							t = t * 1;
							if(t > 60 || t < 0){
								return;
							}
							t = t.toFixed(1);
							if(t < 60 && t+2 > maxTemp){
								maxTemp = Math.round(t+2);
							}
							else if(t > 0 && t-2 < minTemp){
								minTemp = Math.round(t-2);
							}
						}else if('light level' === currentAttribute){
							var time = new moment(attr.creationDate).hour();
							if(t >= 0 && t < 256 && t % 16 == 0){
								t = t / 16;
								var maxHour = byHour[time];
								if(typeof maxHour == 'undefined'){
									byHour[time] = [];
								}
								byHour[time].push(t);
							}else {
								return true;
							}
						}
						chartData.push( [new moment(attr.creationDate).toDate(), t]);
					});
				}
				
			});

			var sortedHours = [];
			if('light level' === currentAttribute){
				for(var key in byHour){
					if(byHour.hasOwnProperty(key)){
						sortedHours.push(key);
					}
				}
				sortedHours.sort();
				var pieData = [];
				var hourlyData = [];
				var pieColors = [];
				var colorByVal = [];
				colorByVal[0] = '#000';
				colorByVal[1] = '#112';
				colorByVal[2] = '#114';
				colorByVal[3] = '#116';
				colorByVal[4] = '#118';
				colorByVal[5] = '#11a';
				colorByVal[6] = '#11c';
				colorByVal[7] = '#11e';
				colorByVal[8] = '#33e';
				colorByVal[9] = '#55e';
				colorByVal[10] = '#77e';
				colorByVal[11] = '#99e';
				colorByVal[12] = '#bbe';
				colorByVal[13] = '#dde';
				colorByVal[14] = '#ddf';
				colorByVal[15] = '#fff';

				var lightByVal = [];
				lightByVal[0] = 'Off';
				lightByVal[1] = 'Very Dim';
				lightByVal[2] = 'Very Dim';
				lightByVal[3] = 'Very Dim';
				lightByVal[4] = 'Very Dim';
				lightByVal[5] = 'Dim';
				lightByVal[6] = 'Dim';
				lightByVal[7] = 'Dim';
				lightByVal[8] = 'Dim';
				lightByVal[9] = 'Bright';
				lightByVal[10] = 'Bright';
				lightByVal[11] = 'Bright';
				lightByVal[12] = 'Bright';
				lightByVal[13] = 'Very Bright';
				lightByVal[14] = 'Very Bright';
				lightByVal[15] = 'Very Bright';

				for(var key = 0; key < 24; ++key){
					var val = byHour[key];
					if(typeof val == 'undefined'){
						pieData.push(1);
						hourlyData.push('No Data');
						pieColors.push('#888');
						continue;
					}
					val.sort();
					if(val.length > 0){
						val = val[Math.floor(val.length/2)];
					}else {
						val = 0;
					}
					pieData.push(1);
					hourlyData.push(val);
					pieColors.push(colorByVal[val]);
				}
			}

			//var googleData = google.visualization.arrayToDataTable(dataTable);

			
			NProgress.done();
//			if(chart == null){
			if('temperature.celsius' === currentAttribute) {
				options.valueRange = [minTemp, maxTemp];
				options.labels = ['Date','Temperature'];
				options.fillGraph = false;
			}else if('light level' === currentAttribute) {
				options.valueRange = [0,16];
				options.labels = ['Date','Light Level'];
				options.fillGraph = true;
			}
			chart = new Dygraph(document.getElementById("temp-chart"),chartData,options);
			if('light level' === currentAttribute){
				$('#light-chart-container').show();
				$('#light-chart').sparkline(pieData,{
					type: 'pie',
					borderWidth: 2,
					borderColor: '#333',
					width: '400px',
					height: '400px',
					offset: -90,
					sliceColors: pieColors,
					tooltipFormatter:  function(sparklines, options, point){
						var hour = point.offset;
						var amPm = hour > 11 ? 'PM' : 'AM';
						if(hour == 0){
							hour = 12;
						}else if(hour > 12) {
							hour = hour - 12;
						}
						var theVal = hourlyData[point.offset];
						var described = theVal >= 0 ? lightByVal[theVal] + ' ('+theVal+'/15)' : theVal;
						return '<span>'+hour+amPm+': '+described+'</span>';	
					}
				});
			}else {
				$('#light-chart-container').hide();
				$('#light-chart').empty();
			}
//			}else {
//				options['file'] = chartData;
//				chart.updateOptions(options);
//			}

}	

/*
google.load("visualization", "1", {packages:["annotatedtimeline"]});
google.setOnLoadCallback(markChartLoaded);
*/

$(document).ready(main);
