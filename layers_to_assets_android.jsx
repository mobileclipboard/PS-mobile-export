var densities = ({
    ldpi:120,
    mdpi:160,
    tvdpi:213,
    hdpi:240,
    xhdpi:320,
    xxhdpi:480,
    xxxhdpi:640
    });

var debug = false;

var pngWebOptions = new ExportOptionsSaveForWeb();
pngWebOptions.format = SaveDocumentType.PNG;
pngWebOptions.PNG8 = false; 
pngWebOptions.transparency = true;
pngWebOptions.optimized = true;
pngWebOptions.quality = 100;

var Layer = function(){}
var ArtLayer = function(){}
var Document = function(){}
var LayerSet = function(){}

String.prototype.trim = function() {
  return this.replace(/^[\s]+|[\s]+$/g, '');
};

File.prototype.partname = function()
{
	var dotPosition=this.displayName.lastIndexOf(".");
    if(dotPosition!=-1)
	return this.displayName.substring(0,dotPosition);
    else return this.displayName;
}  

Folder.prototype.createOnce = function()
{
        if(!this.exists) this.create();
        return this;
}

String.prototype.partname = function()
{
	var dotPosition=this.lastIndexOf(".");
    if(dotPosition!=-1)
	return this.substring(0,dotPosition);
    else return this;
}  


Document.prototype.getAllVisibleLayersPrefixed = function(prefix)
{
    var result = [];

    for(var i=this.layers.length-1;i>=0;i--)
	{
log("doc" + i);
if(!this.layers[i].visible) continue;
         if(this.layers[i].name.indexOf(prefix)==0)
         result.push(this.layers[i]);

         if (this.layers[i].typename=="LayerSet") 
          result=result.concat(this.layers[i].getAllVisibleLayersPrefixed(prefix));

	}

    return result;
}

LayerSet.prototype.getAllVisibleLayersPrefixed = function(prefix)
{
    var result = [];
    for(var i=this.layers.length-1;i>=0;i--)
	{
log("ls" + i);
if(!this.layers[i].visible) continue;
         if(this.layers[i].name.indexOf(prefix)==0)
         result.push(this.layers[i]);

         if (this.layers[i].typename=="LayerSet") 
          result=result.concat(this.layers[i].getAllVisibleLayersPrefixed(prefix));

	}

    return result;
}

main();

function main()
{
    if(!app.documents.length) return;
    
          var  myOldDisplay = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;
    var myOldPrefs=app.preferences.rulerUnits;
    app.preferences.rulerUnits=Units.POINTS;
    
    
var docRef = app.activeDocument;

 var resourceName = getResourceName();
        if (!resourceName) {
            return;
        }

var sourceDensity = parseInt(prompt("Please enter source density",240));
if(isNaN(sourceDensity) || sourceDensity<=0) return;

    var targetFolder = Folder(Folder.desktop+"/"+resourceName);

    try{
        targetFolder = Folder(docRef.path+"/"+resourceName);
        }catch(e){}
        
        
        if(!targetFolder.exists) targetFolder.create();
        
var allIndexes = getLayerSetsIndex();
var assets = [];
for(var i=0;i<allIndexes.length;i++)
{
    var currName = layerName(allIndexes[i]);
       if(currName.indexOf("@")==0)
        assets.push({index:allIndexes[i],name:currName});
}

for(var i=0;i<assets.length;i++ ){  
 var currLayerIndex = assets[i].index; 
selectLayerByIndex(currLayerIndex);
 if(!docRef.activeLayer.visible) continue;
 var assetName = assets[i].name.substring(1).replace(/[:\/\\*\?\"\<\>\|]/g, "_");  
 dupLayers();  

var scaleFactor = docRef.resolution/sourceDensity;
 app.activeDocument.resizeImage(app.activeDocument.width.value*scaleFactor,app.activeDocument.height.value*scaleFactor);
 
 //export for each resolution
 var initialState = app.activeDocument.activeHistoryState;
 

    for(var prop in densities)
    {
        var currFolder = Folder(targetFolder+"/drawable-"+prop).createOnce();
        var currFile = File(currFolder+"/"+assetName+".png");
        app.activeDocument.resizeImage(app.activeDocument.width,app.activeDocument.height,densities[prop]);
        
         try{app.activeDocument.mergeVisibleLayers();}catch(e){}  
         try{app.activeDocument.trim(TrimType.TRANSPARENT,true,true,true,true);}catch(e){} 
        
        app.activeDocument.exportDocument(currFile, ExportType.SAVEFORWEB, pngWebOptions);
         app.activeDocument.activeHistoryState = initialState;
    }
app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
 
}



}//main

function dupLayers() {   
    var desc143 = new ActionDescriptor();  
        var ref73 = new ActionReference();  
        ref73.putClass( charIDToTypeID('Dcmn') );  
    desc143.putReference( charIDToTypeID('null'), ref73 );  
        var ref74 = new ActionReference();  
        ref74.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );  
    desc143.putReference( charIDToTypeID('Usng'), ref74 );  
    executeAction( charIDToTypeID('Mk  '), desc143, DialogModes.NO );  
};  

function selectLayerByIndex(index,add){   
   add = (add == undefined)  ? add = false : add;  
var ref = new ActionReference();  
    ref.putIndex(charIDToTypeID("Lyr "), index);  
    var desc = new ActionDescriptor();  
    desc.putReference(charIDToTypeID("null"), ref );  
         if(add) desc.putEnumerated( stringIDToTypeID( "selectionModifier" ), stringIDToTypeID( "selectionModifierType" ), stringIDToTypeID( "addToSelection" ) );   
      desc.putBoolean( charIDToTypeID( "MkVs" ), false );   
     try{  
    executeAction(charIDToTypeID("slct"), desc, DialogModes.NO );  
}catch(e){}  
};  


function getLayerSetsIndex(){
       function getNumberLayers(){
       var ref = new ActionReference();
       ref.putProperty( charIDToTypeID("Prpr") , charIDToTypeID("NmbL") )
       ref.putEnumerated( charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") );
       return executeActionGet(ref).getInteger(charIDToTypeID("NmbL"));
       }
       function hasBackground() {
           var ref = new ActionReference();
           ref.putProperty( charIDToTypeID("Prpr"), charIDToTypeID( "Bckg" ));
           ref.putEnumerated(charIDToTypeID( "Lyr " ),charIDToTypeID( "Ordn" ),charIDToTypeID( "Back" ))//bottom Layer/background
           var desc =  executeActionGet(ref);
           var res = desc.getBoolean(charIDToTypeID( "Bckg" ));
           return res   
        };
       function getLayerType(idx,prop) {        
           var ref = new ActionReference();
           ref.putIndex(charIDToTypeID( "Lyr " ), idx);
           var desc =  executeActionGet(ref);
           var type = desc.getEnumerationValue(prop);
           var res = typeIDToStringID(type);
           return res   
        };
       var cnt = getNumberLayers()+1;
       var res = new Array();
       if(hasBackground()){
             var i = 0;
          }else{
             var i = 1;
          };
       var prop =  stringIDToTypeID("layerSection") 
       for(i;i<cnt;i++){
          var temp = getLayerType(i,prop);
          if(temp == "layerSectionStart" || temp == "layerSectionContent") res.push(i);
       };
       return res;
    };


       function layerName(idx) {        
           var ref = new ActionReference();
           ref.putIndex(charIDToTypeID( "Lyr " ), idx);
           var desc =  executeActionGet(ref);
           return desc.getString(stringIDToTypeID("name") );
        };

function getSelectedLayersIdx(){  
   var selectedLayers = new Array;  
   var ref = new ActionReference();  
   ref.putEnumerated( charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") );  
   var desc = executeActionGet(ref);  
   if( desc.hasKey( stringIDToTypeID( 'targetLayers' ) ) ){  
      desc = desc.getList( stringIDToTypeID( 'targetLayers' ));  
       var c = desc.count   
       var selectedLayers = new Array();  
       for(var i=0;i<c;i++){  
         try{   
            activeDocument.backgroundLayer;  
            selectedLayers.push(  desc.getReference( i ).getIndex() );  
         }catch(e){  
            selectedLayers.push(  desc.getReference( i ).getIndex()+1 );  
         }  
       }  
    }else{  
      var ref = new ActionReference();   
      ref.putProperty( charIDToTypeID("Prpr") , charIDToTypeID( "ItmI" ));   
      ref.putEnumerated( charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") );  
      try{   
         activeDocument.backgroundLayer;  
         selectedLayers.push( executeActionGet(ref).getInteger(charIDToTypeID( "ItmI" ))-1);  
      }catch(e){  
         selectedLayers.push( executeActionGet(ref).getInteger(charIDToTypeID( "ItmI" )));  
      }  
   }  
   return selectedLayers;  
};  

////// based on code by michael l hale //////
function checkDesc2 (theDesc) {
var c = theDesc.count;
var str = '';
for(var i=0;i<c;i++){ //enumerate descriptor's keys
  str = str + 'Key '+i+' = '+typeIDToStringID(theDesc.getKey(i))+': '+theDesc.getType(theDesc.getKey(i))+'\n'+getValues (theDesc, i)+'\n';
  };
log("desc\n\n"+str);
};
////// check //////
function getValues (theDesc, theNumber) {
switch (theDesc.getType(theDesc.getKey(theNumber))) {
case DescValueType.BOOLEANTYPE:
return theDesc.getBoolean(theDesc.getKey(theNumber));
break;
case DescValueType.CLASSTYPE:
return theDesc.getClass(theDesc.getKey(theNumber));
break;
case DescValueType.DOUBLETYPE:
return theDesc.getDouble(theDesc.getKey(theNumber));
break;
case DescValueType.ENUMERATEDTYPE:
return (typeIDToStringID(theDesc.getEnumerationValue(theDesc.getKey(theNumber)))+"_"+typeIDToStringID(theDesc.getEnumerationType(theDesc.getKey(theNumber))));
break;
case DescValueType.INTEGERTYPE:
return theDesc.getInteger(theDesc.getKey(theNumber));
break;
case DescValueType.LISTTYPE:
return theDesc.getList(theDesc.getKey(theNumber));
break;
case DescValueType.OBJECTTYPE:
return (theDesc.getObjectValue(theDesc.getKey(theNumber))+"_"+typeIDToStringID(theDesc.getObjectType(theDesc.getKey(theNumber))));
break;
case DescValueType.REFERENCETYPE:
return theDesc.getReference(theDesc.getKey(theNumber));
break;
case DescValueType.STRINGTYPE:
return theDesc.getString(theDesc.getKey(theNumber));
break;
case DescValueType.UNITDOUBLE:
return (theDesc.getUnitDoubleValue(theDesc.getKey(theNumber))+"_"+typeIDToStringID(theDesc.getUnitDoubleType(theDesc.getKey(theNumber))));
break;
default:
break;
};
};

 function  getResourceName() {

        var name = app.activeDocument.name.partname();
        return prompt("Android Resource Name", name);
 
    };

function log(msg)
{
if (!debug) return; 
try{
$.writeln("----");     
$.writeln(msg+" - "+msg.toSource());    
}catch(e){}
}