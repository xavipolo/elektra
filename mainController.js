sap.ui.controller("myController", {

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

		console.log('onDataLoad()');
		
		const colors = {
			high: '#FF6600',
			medium: '#88c4d4',
			low: '#a5d46a'
		};

		var oVizFrame = this.getView().byId("idVizFrameBar");
		console.log(oVizFrame.getModel('day'));
		console.log(oVizFrame.getModel('day').getData());

		var jsonData = oVizFrame.getModel('day').getData();

		//var oPage = this.getView().byId("idPage");
		const data_date = jsonData[0].day;
		//oVizFrame.setTitle('Precios para ' + data_date);


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
								background: '#198754',
							},
							color: '#198754'

						}, {
							value: mid_value,
							visible: true,
							label: {
								text: "Med",
								visible: true,
								background: '#FF9300'
							},
							color: '#FF9300'
						}, {
							value: high_value,
							visible: true,
							label: {
								text: "High",
								visible: true,
								background: "#ad1f2d"
							},
							color: '#ad1f2d'
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

	}

});

sap.ui.view({
	viewContent: jQuery('#myXml').html(),
	type: sap.ui.core.mvc.ViewType.XML
}).placeAt("content")
