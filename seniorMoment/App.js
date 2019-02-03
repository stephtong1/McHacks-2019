import React from 'react';
import { AppRegistry, View, Dimensions, Button, Text, TouchableOpacity } from 'react-native';
import { Camera, Permissions } from 'expo';
import axios from 'axios';
import { DrawerLayoutAndroid, } from 'react-native-gesture-handler';
import { SQLite } from 'expo'

const db = SQLite.openDatabase('myow.db')

// ############################################################################################
//                                          API KEYS
// ############################################################################################
const translateApi = `https://translation.googleapis.com/language/translate/v2?key=AIzaSyBORAUjBQUZ9ZL2Ezw22lhAM9h28ZyH2Bw`;

// ############################################################################################
//                                            MAIN
// ############################################################################################
export default class UseCamera extends React.Component{ 

  // ###########################STATES########################################################
  state = {
    hasCameraPermission: null,
    direction: Camera.Constants.Type.back,
    ratio: this.setAppropriateRatio(),
    identifedAs: '',
    loading: false,
    languageCode: 'en',
    open: false,
    words: [""],
    quotes: [
      "Remember to use reusable water bottles!", 
      "Think about composting when you trash your leftovers!",
    ],
  };

  // ###########################STORAGE########################################################

  //Hard-codede quotes banks

  // const 

  //each time app is opened. it has a list of activated quotes in that same active frame.
  // let
  componentDidMount() {
    db.transaction(tx => {
      tx.executeSql(
        'create table if not exists items (id integer  primary key not null, value text);'
        //'drop table items'
      )
    })
  }


  saveQuote(){
    db.transaction(
      tx => {
        tx.executeSql(
          'insert into items (value) values (?)',
          [
            this.state.identifedAs
          ]
        )
        tx.executeSql('select * from items', [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        )
      },
      null,
      this.update
    )
  }

  clearLocalData = () => {
    db.transaction(tx => {
      tx.executeSql(
        'drop table items;'
        //'drop table items'
      )
      tx.executeSql(
        'create table if not exists items (id integer primary key not null, value text);'
        //'drop table items'
      )

    })
  }

  // ###########################CAMERA########################################################
  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted'});
  }

  setAppropriateRatio(){
    let { height, width } = Dimensions.get('window');
    // console.log("Height:"+height+"\tWidth:"+width);
    let a = this.reduce(height, width);
    // console.log(`${a[0]}:${a[1]}`);
    return `${a[0]}:${a[1]}`;
  }

  reduce(numerator,denominator){
    var gcd = function gcd(a,b){
      return b ? gcd(b, a%b) : a;
    };
    gcd = gcd(numerator,denominator);
    return [numerator/gcd, denominator/gcd];
  }

  // ###########################CENTER OF ACTION########################################################
  takePicture = async() => {
    if (this.camera) {
      // this.camera.pausePreview();
      this.setState((previousState, props) => ({
        loading: true
      }));

      const photo = await this.camera.takePictureAsync({ onPictureSaved: this.onPictureSaved, base64: true });

      this.identifyImage(photo.base64);
      
    } 
  };

async identifyImage(imageData){
    //local word
    let word = "";
    // Initialise the Clarifai api
    const Clarifai = require('clarifai');
    const app = new Clarifai.App({
        apiKey: 'fac2e057ac404c80acabd9a413f6532e'
    });
    // Identify the image
    try{
      response = await app.models.predict(Clarifai.GENERAL_MODEL, {base64: imageData})
      word = response.outputs[0].data.concepts[0].name
      console.log(response.outputs[0].data.concepts[0].name)
    } catch(err) { alert(err) }

    await this.translate(word);

    this.setState(prevState => ({
      words: [...prevState.words, word + ' - ' + this.state.identifedAs]
    }));

    // switch(word){ 
    //   case 'no person':
    //     var quote = "WOw"
    //     if (this.state.quotes.includes(quote)===false) 
    //       this.state.quotes.push(quote)
    //     break;
    //   case 'abstract':
    //     var quote = "Dman"
    //     if (this.state.quotes.includes(quote)===false) 
    //       this.state.quotes.push(quote)
    //     break;
    //   default:
    //     this.saveQuote();
    //     break;
    // }
  };

  setImageIdentification(identifiedImage){
      // Dismiss the acitivty indicator
      this.setState((prevState, props) => ({
          identifedAs:identifiedImage,
          loading:false
      }));
  }

  // ###########################CAMERA########################################################

  changeLanguage(languageCode) {
      this.setState({ languageCode: languageCode });
  }

  async translate(temp_word){
    try {
      response = await axios.post(translateApi, {
        q: temp_word, //this.state.identifedAs 
        target: this.state.languageCode //this.state.languageCode
        })
      console.log(response.data.data.translations[0].translatedText)
      console.log(response.data.data.translations[0].detectedSourceLanguage)
      this.setState((prevState, props) => ({
        identifedAs:JSON.stringify(response.data.data.translations[0].translatedText),
        loading:false
      }));
    } catch (e) {}
  }

  // ############################LANGUAGE#######################################################

  render(){
    const { hasCameraPermission } = this.state;
    
    //Drawer views
    // ############################DRAWER#######################################################
    const leftNavigationView = (
      <View style={{ flex: 2, flexDirection: 'column', backgroundColor: '#fff' }}>

        {/* WORDS */}
        <View style={{backgroundColor: 'rgb(111, 207, 226)'}}>
          <Text style={{ margin: 10, marginTop: 100, fontSize: 23, textAlign: 'right', 
            color: 'rgb(255, 255, 255)'}}>         
            Words history
          </Text>
        </View>
        <View>
        {this.state.words.map( (word, key) => {
          return (
            <Text style={{ margin: 10, marginTop: 0, textAlign: 'right', color: '#828280', lineHeight: 24}}
              key={key}>
              {word}
            </Text>
          )
        })}
        </View>


      </View>
    );

    const rightNavigationView = (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{backgroundColor: 'rgb(111, 207, 226)'}}>
          <Text style={{ margin: 10, marginTop: 100, fontSize: 23, textAlign: 'left', 
            color: 'rgb(255, 255, 255)'}}>
            Language menu
          </Text>
        </View>
        <TouchableOpacity onPress={() => { this.changeLanguage('en') }}><Text style={styles.p}>English</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { this.changeLanguage('fr') }}><Text style={styles.p}>French</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { this.changeLanguage('de') }}><Text style={styles.p}>German</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { this.changeLanguage('zh') }}><Text style={styles.p}>Chinese</Text></TouchableOpacity>
      
        {/* QUOTES */}
        <View style={{
          justifyContent: 'flex-start'}}>
          <View>
            <TouchableOpacity
              onPress={() => {
                this.setState( prevState => ({
                  open: !prevState.open
                }))
              }}>
              <Text style={{ margin: 10, marginTop: 10, fontSize: 23, textAlign: 'left', 
                color: 'rgb(111, 207, 226)'}}>         
                Acquired quotes
              </Text>
              {this.state.open && 
                this.state.quotes.map( (quote, key) => {
                  return (
                    <Text style={{ margin: 10, marginTop: 0, textAlign: 'left', color: '#828280', lineHeight: 24}}
                      key={key}>
                      {quote}
                    </Text>
                  )
                })
              }
            </TouchableOpacity>
          </View>
        </View>
        
      </View>
    );
    //End Drawer views

    if (hasCameraPermission === null) {
      return (
        <View style={{flex:1}}>
          <Text>Loading</Text>
        </View>
      );
      // return <Text>Asking camera permission</Text>;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <DrawerLayoutAndroid
          drawerWidth={200}
          drawerPosition={DrawerLayoutAndroid.positions.Left}
          renderNavigationView={() => leftNavigationView}>
          
        <DrawerLayoutAndroid
          drawerWidth={200}
          drawerPosition={DrawerLayoutAndroid.positions.Right}
          renderNavigationView={() => rightNavigationView}>
 
            <View style={{flex:1, flexDirection:'column', justifyContent:'center',}}>
              
              <Camera style={{flex:1}} type={this.state.type} ratio={this.state.ratio} ref={ref => { this.camera = ref; }}  >
                
                <View style={{flex:1, flexDirection: 'column',justifyContent: 'space-evenly', alignItems: 'stretch',}}>

                  <Text style= {{ fontSize: 40, flexDirection: "row", textAlign: 'center', 
                    backgroundColor: !!this.state.identifedAs ? 'rgba(85, 87, 91, 0.1)' : 'rgba(0,0,0,0)',
                    textShadowColor: 'rgba(255, 255, 255, 1)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10}}>
                    {this.state.identifedAs}
                    </Text>
                
                </View>
                <View style={{flex:1 , flexDirection: 'column', justifyContent: 'flex-end',}}>
                  <Button 
                    onPress={
                      this.takePicture
                        }
                    title="Snap!"
                    color='rgb(111, 207, 226)'
                  />
                </View>
              </Camera>
            </View>
           </DrawerLayoutAndroid>
        </DrawerLayoutAndroid>
      );
    }
  }
}

const styles =  {
  container: {
      padding: 40,
      backgroundColor: '#FAFAFA',
  },
  p: {
      color: '#828280',
      lineHeight: 24,
      margin: 10
  },
}