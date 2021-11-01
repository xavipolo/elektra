sap.ui.controller("mainController", {

	onInit: function() {

		var oThis = this;

		var oVizFrame = this.getView().byId("idVizFrameBar");

		var oJSONModel = new sap.ui.model.json.JSONModel();
		oJSONModel.loadData('https://raw.githubusercontent.com/jorgeatgu/apaga-luz/main/public/price-postprocessed.json');

		oJSONModel.attachRequestCompleted(function(oEvent, t) {
			console.log('attachRequestCompleted');
			oThis.onDataLoad(oEvent);
		});

		this.getView().setModel(oJSONModel, 'day');

		oVizFrame.setBusy(true);
		oVizFrame.destroyDataset();
		oVizFrame.destroyFeeds();

		var oDataset = new sap.viz.ui5.data.FlattenedDataset({
			dimensions: [{
				name: "Hour",
				value: "{hour}"
			}],
			measures: [{
				name: 'Price',
				value: '{price}'
			}],
			data: {
				path: "day>/"
			}
		});
		oVizFrame.setDataset(oDataset);

		var feedPrimaryValues = new sap.viz.ui5.controls.common.feeds.FeedItem({
			uid: "valueAxis",
			type: "Measure",
			values: ["Price"]
		});
		var feedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
			uid: "categoryAxis",
			type: "Dimension",
			values: ["Hour"]
		});
		oVizFrame.addFeed(feedCategoryAxis);
		oVizFrame.addFeed(feedPrimaryValues);



		oVizFrame.setVizProperties({
			general: {
				layout: {
					padding: 0.04
				}
			},
			categoryAxis: {
				title: {
					text: "Hour",
					visible: true
				},
				axisTick: {
					visible: false
				},
				axisLine: {
					visible: false
				}
			},
			valueAxis: {
				title: {
					visible: false
				},
				axisTick: {
					visible: true
				},
				axisLine: {
					visible: false
				},
				label: {
					visible: true
				}
			},
			title: {
				visible: false
			},
			legend: {
				visible: true
			},

			interaction: {
				selectability: {
					mode: "EXCLUSIVE",
					axisLabelSelection: false
				}
			}

		});

	},

	onChangeTheme: function(oEvent) {
		if (oEvent.getSource().getPressed()) {
			sap.ui.getCore().applyTheme("sap_fiori_3");
		} else {
			sap.ui.getCore().applyTheme("sap_fiori_3_dark");
		}
	},

	onChangeZoom: function(direction) {
		var oVizFrame = this.getView().byId("idVizFrameBar");
		oVizFrame.zoom({
			direction: direction
		});
	},



	onDataLoad: function(oEvent) {

		console.debug('onDataLoad()');
		
		const colors = {
			high: '#ee9b00',//'#FF6600',
			medium: '#88c4d4',
			low: '#a5d46a',

			highRef: '#ca6702',// '#ad1f2d',
			mediumRef: '#457b9d', //'#FF9300',
			lowRef: '#198754'

		};
		this.colors = colors;

		var oVizFrame = this.getView().byId("idVizFrameBar");
		var jsonData = oVizFrame.getModel('day').getData();
		const data_date = jsonData[0].day;

		var min_value = Math.min.apply(Math, jsonData.map(function(o) {
			return o.price;
		}))
		var max_value = Math.max.apply(Math, jsonData.map(function(o) {
			return o.price;
		}))
		var avg_value = (min_value + max_value) / 2;

		var offset = (max_value - min_value) / 3;
		var mid_value = min_value + offset;
		var high_value = min_value + offset * 2;


		const d = new Date();
		let current_hour = d.getHours();

		var current_price = jsonData.find(t => t.hour == current_hour).price;

		var max_hour = jsonData.find(t => t.price == max_value).hour;
		var min_hour = jsonData.find(t => t.price == min_value).hour;

		var actual_category;
		if (current_price < mid_value)
			actual_category = sap.m.ValueColor.Good;
		else if (current_price < high_value)
			actual_category = sap.m.ValueColor.Neutral;
		else
			actual_category = sap.m.ValueColor.Critical;

		var indicator = [];
		indicator[sap.m.ValueColor.Critical] = 'Up';
		indicator[sap.m.ValueColor.Neutral] = 'None';
		indicator[sap.m.ValueColor.Good] = 'Down';



		//2nd model for KPIs
		var oJSONModelKPIs = new sap.ui.model.json.JSONModel();
		oJSONModelKPIs.setData({
			actual: {
				price: current_price,
				currency: 'EUR',
				hour: `${current_hour}h`,
				category: actual_category,
				indicator: indicator[actual_category]
			},
			average: {
				price: avg_value,
				currency: 'EUR',
				day: data_date,
				indicator: 'None',
				category: sap.m.ValueColor.Neutral
			},
			max: {
				price: max_value,
				currency: 'EUR',
				hour: `${max_hour}h`,
				category: sap.m.ValueColor.Critical,
				indicator: 'Up'
			},
			min: {
				price: min_value,
				currency: 'EUR',
				hour: `${min_hour}h`,
				category: sap.m.ValueColor.Good,
				indicator: 'Down'
			},
		});
		this.getView().setModel(oJSONModelKPIs, 'kpis');


		oVizFrame.setVizProperties({
			title: {
				text: data_date,
				visible: true
			},

			plotArea: {

				window: {
					start: {
						categoryAxis: {
							'Hour': current_hour
						}
					},
					end: {
						categoryAxis: {
							'Hour': 23
						}
					}
				},

				dataPointStyle: {
					rules: [{
							dataContext: {
								"Price": { min: high_value }
							},
							properties: {
								color: colors.high
							},
							displayName: "High"
						},
						{
							dataContext: {
								"Price": {
									min: mid_value,
									max: high_value
								}
							},
							properties: {
								color: colors.medium 
							},
							displayName: "Medium"
						}
					],
					others: {
						properties: {
							color: colors.low
						},
						displayName: "Low"
					}
				},

				referenceLine: {
					defaultStyle: {
						type: 'dash',
						size: 3,
						label: {
							fontWeight: 'bold'
						}
					},

					line: {
						valueAxis: [{
							value: min_value,
							visible: true,
							label: {
								text: "Min",
								visible: true,
								background: colors.lowRef,
							},
							color: colors.lowRef

						}, {
							value: mid_value,
							visible: true,
							label: {
								text: "Med",
								visible: true,
								background: colors.mediumRef
							},
							color: colors.mediumRef
						}, {
							value: high_value,
							visible: true,
							label: {
								text: "High",
								visible: true,
								background: colors.highRef
							},
							color: colors.highRef
						}]
					}
				},

				dataLabel: {
					//formatString: 'datalabelFormat',
					visible: true
				}
			}
		});


		oVizFrame.setBusy(false);

	},
	
	onPressCalculate: function(oEvent){
	
		var oVizFrame = this.getView().byId("idVizFrameBar");
		var jsonData = oVizFrame.getModel('day').getData();
		console.debug('onPressCalculate');
		
		var oView = this.getView();
		var num_hours = Math.ceil(parseFloat(oView.byId("num_hours").getValue()));
		console.debug('*******************************************');
		console.debug('num_hours = '+num_hours);
		console.debug('jsonData.length = '+jsonData.length);

		if (num_hours > 0 && num_hours < 24){
			
			let min_price_h1, min_price_h2, min_price, price;
			
			for (let c=0; c<jsonData.length; c++){

				console.debug('* c = '+c);
				
				if (jsonData.length - c < num_hours) {
					console.debug('no quedan horas')
					break;
				}
				
				for (let c2=c ; c2 < (c+num_hours); c2++) {
					console.debug('c2 = '+c2);
					console.debug('c2 price = '+jsonData[c2].price);
					if (c2==c) price = 0;
					price += jsonData[c2].price;
				}
				
				price = (price / num_hours).toFixed(3);
				
				if (c == 0 || price < min_price){
					min_price = price;
					min_price_h1 = c;
					min_price_h2 = c + num_hours-1;
				}
			
			}
			
			oView.byId("res_hours").setText(min_price_h1 + ":00 a " + min_price_h2 + ":59 con precio medio de " + min_price);
		
		
		}
		else {
			oView.byId("res_hours").setText('');
		}
		
	}



});

sap.ui.view({
	viewContent: jQuery('#myXml').html(),
	type: sap.ui.core.mvc.ViewType.XML
}).placeAt("content")
