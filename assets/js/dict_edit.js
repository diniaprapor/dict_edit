/*
todo:
* New phrase addition dialog for language select
*/
var buildVersion = 0.12;

$(document).ready(function(){
    var loadedFileName = "";
    var loadedFileXml;

    //patch for browsers not having contains() method
    if (!String.prototype.contains) {
        String.prototype.contains = function(s, i) {
            return this.indexOf(s, i) != -1;
        }
    }

    $('#dictInputDiv').prepend(editorVersionDate());

    function showDeleteButton(show){
        if(show)
            document.getElementById('deletebuttondiv').style.display = 'block';
        else
            document.getElementById('deletebuttondiv').style.display = 'none';
    }

    function reloadPhrases(xml, filter, filterByText, removeLocalizationsTable){
        if(typeof(filter)==='undefined'){
            filter = $("#filter").val();
        }

        if(typeof(filterByText)==='undefined'){
            filterByText = $("#filterByText").val();
        }

        if(typeof(removeLocalizationsTable)==='undefined') removeLocalizationsTable = false;
        if(removeLocalizationsTable)$('#localizations').remove();

        //$('#phrases').remove();
        $('#phrases').empty();
        console.log("reloadPhrases " + filter + " " + filterByText);
        var s = $('#phrases');//$('<select id="phrases" name="decision2" size="10"/>');

        xml.find("Phrase").each(function(){
            var goodPhrase = true;
            var phraseID = $(this).attr("ID");
            if (!new RegExp(filter,"i").test(phraseID)){
                goodPhrase = false;

                //console.log($(this).attr("ID"));
            }


            if (goodPhrase) {
                goodPhrase = false;
                $(this).children().each(function(){
                    var phrase = $(this).attr('value');
                    if (new RegExp(filterByText,"i").test(phrase)){
                        goodPhrase = true;
                        return false;
                    }
                });
            }
            if (goodPhrase) {
                s
                    .append($("<option></option>")
                    .attr("value",phraseID)
                    .text(phraseID.substr(0, 32)));
            }
        });
        //$("#list").after(s);
    }

    function loaded(evt){
        console.log("file loaded");
        var fileString = evt.target.result,
        xmlDoc = $.parseXML(fileString),
        $xml = $(xmlDoc);
        loadedFileXml = $xml;
        reloadPhrases($xml, "", "");

        document.getElementById('extraz').style.display = 'block';

        //export action
        $('#export').remove();
        $('#dict').after($('<input type="button" id="export" name="export" value="Export" size="40">').click(function(e){
                console.log('export');
                $.generateFile({
                    filename	: loadedFileName,
                    content		: (new XMLSerializer()).serializeToString(xmlDoc)
                                    //some hackish text manipulations needed to fix entry addition and deletion results
                                    .replace(new RegExp('Phrase><Phrase', 'g'),"Phrase>\n\t\t<Phrase")
                                    .replace(/( {8}\n){2,}/g, ''),
                    script		: 'http://localhost/dict_edit/download.php'
                });

                e.preventDefault();
            })
        );

    }

    //extract selected phrase localized values
    $('#phrases').on('change', function() {
        $('#localizations').remove();
        var t = $('<table id="localizations" style = "width:100%" />');
        var selected = $(this).val();
        console.log('selected ' + selected);
        //id change functionality
        t.append($('<tr>').append('<td>ID</td>').append($('<textarea>' + selected + '</textarea>').change(function(){
                console.log($(this).val());
                loadedFileXml.find('Phrase[ID="' + selected + '"]').attr('ID', $(this).val());
                $('#phrases option[value="' + selected + '"]').attr('value', $(this).val()).text($(this).val().substr(0, 32));
            })
        ));
        loadedFileXml.find('Phrase[ID="' + this.value + '"]').children().each(function(){
            //console.log($(this).attr('value'));
            var thisTag = $(this);
            var lang = $(this).prop("tagName");
            var translation = $(this).attr('value');

            var display;
            if ($('#showMotkPhrases').is(':checked')) {
                display = 'inline';
            } else {
                display = 'none';
            }

            var tableData = '<div class="phrase" unselectable="on" style="display:' + display + ';" onselectstart="return false" id="hidden' + lang + '">' + parseMotkString(translation) + '</div>';
            tableData = '<div class="editableText" contentEditable=true id="' + lang + '">'+translation+'</div>' + tableData;
            t.append($('<tr>').append('<td>' + lang + '</td>').append($(tableData)));
            //This piece was not functioning properly, so just disabled it without trying to fix.
            /*.on('change keyup paste ', function(){
                    $(this).html($(this).text())
                    var data = parseToMotkString($(this).html());
                    console.log('CHANGE ' + this.id + ' ' + data);

                    $('#hidden' + this.id).html(parseMotkString(data));

                    thisTag.attr('value', parseToMotkString(data));
                })
            ));*/
        });
        $('#locas').after(t);
        updateDefaultTextColor(document.getElementById('textColor').value);
        updateBackgroundColor(document.getElementById('backgroundColor').value);
        updateDefaultOutlineColor(document.getElementById('outlineColor').value);
        //document.getElementById('deletebuttondiv').style.display = 'block';
        showDeleteButton(true);
    });

    //filter action
    $("#filter").val("");
    $("#filter").on('input', function(){
        console.log($(this).val());
        reloadPhrases(loadedFileXml, $(this).val(), "", true);
        showDeleteButton(false);
    });
    $('#filterreset').click(function(e){
        $("#filter").val("");
        reloadPhrases(loadedFileXml, "", "", true);
        showDeleteButton(false);
    });

    $("#filterByText").val("");
    $("#filterByText").change(function(){
        console.log($(this).val());
        reloadPhrases(loadedFileXml, "", $(this).val(), true);
        showDeleteButton(false);
    });
    $('#filterbytextreset').click(function(e){
        $("#filterByText").val("");
        reloadPhrases(loadedFileXml, "", "", true);
        showDeleteButton(false);
    });

    $('#enableOutline').on('change', function() {
        updateDefaultOutlineColor(document.getElementById('outlineColor').value);
        //console.log($(this).is(':checked'));
    });
    $('#enableTestOutline').on('change', function() {
        updateTestPhrase(document.getElementById('outlineColor').value);
        //console.log($(this).is(':checked'));
    });

    $('#enableBackgroundColor').on('change', function() {
        updateBackgroundColor(document.getElementById('backgroundColor').value);
        console.log($(this).is(':checked'));

    });



    $('#showMotkPhrases').on('change', function() {
        var phrases = document.getElementsByClassName('phrase');


        var i;
        for (i = 0; i < phrases.length; i++) {
            if ($(this).is(':checked'))
                phrases[i].style.display = 'inline';
            else
                phrases[i].style.display = 'none';
        }
        //console.log();
    });

    //add new phrase functionality
    $('#phraseadd').click(function(e){
        var newphraseid = $('#newphrase').val().toUpperCase();
        if(!newphraseid || /\s/g.test(newphraseid)){
            console.log('Phrase id cannot be empty or have whitespace');
            alert('Phrase id cannot be empty or have whitespace');
            $('#newphrase').focus();
        }
        else if(loadedFileXml.find('Phrase[ID="' + newphraseid + '"]').length != 0){
            console.log('This phrase id already exists');
            alert('This phrase id already exists');
            $('#newphrase').focus();
        }
        else{
            console.log(newphraseid);
            var selected = $('#phrases').val();
            //console.log('not selected: ' + !selected);
            var lastPhrase = (!selected) ? loadedFileXml.find("Phrase").last() : loadedFileXml.find('Phrase[ID="' + selected + '"]');
            var phraseTemplate = lastPhrase.clone();
            //console.log(phrase_template.attr("ID"));
            phraseTemplate.attr("ID", newphraseid);
            phraseTemplate.children().each(function(){
                $(this).attr('value', 'no_translation_' + $(this).prop("tagName").toUpperCase());
            });
            lastPhrase.after(phraseTemplate);
            var newOption = $("<option></option>")
                .attr("value",newphraseid)
                .text(newphraseid.substr(0, 32));
            newOption.insertAfter('#phrases option[value="' + lastPhrase.attr('ID') + '"]');
            $('#phrases').val(newphraseid);
            $('#phrases').change();
            $('#newphrase').val("");
            $('#newphrase').focus();
        }
    });

    //remove entry functionality
    $('#removeentry').click(function(){
        var selected = $('#phrases option:selected').val();
        loadedFileXml.find('Phrase[ID="' + selected + '"]').remove();
        $('#phrases option[value="' + selected + '"]').remove();
        $('#phrases').val($('#phrases option:first').val());
        $('#phrases').change();
        console.log('remove entry ' + selected);
    });

    //upload file
    function handleFileSelect(evt) {
        var files = evt.target.files;
        for (var i = 0, f; f = files[i]; i++) {
            console.log(f.name);
            if (!f.name.match(/.(xml)$/)) {
                console.log("not xml!");
                continue;
            }
            loadedFileName = f.name;
            var reader = new FileReader();
            reader.onload = loaded
            reader.readAsText(f);
        }
    }


    $('#setColor').click(function(e){
        var parent = window.getSelection().getRangeAt(0).commonAncestorContainer.parentNode;
        if (new RegExp('^hidden',"i").test(parent.id))
            return;
        var divElement = document.getElementById(parent.id);
        var divText = $(divElement).html();
        var offset = window.getSelection().anchorOffset;
        var selectedText = "" + window.getSelection();

        var color = document.getElementById('setColorPicker').value;


        var newText = divText.substring(0, window.getSelection().anchorOffset) + "[font-color="+ color +"]" + window.getSelection() + "[font-color-restore]" + divText.substring(offset + selectedText.length, divText.length);

        $(divElement).html(newText);

        $('#hidden' + parent.id).html(parseMotkString(newText));
        $(divElement).change();

        var startNode = divElement.firstChild;

        var range = document.createRange();
        range.setStart(startNode, offset + 19);
        range.setEnd(startNode, offset + selectedText.length + 19);
        var sel = window.getSelection();


        sel.removeAllRanges();
        sel.addRange(range);
    });

    $('#setOutline').click(function(e){
        var parent = window.getSelection().getRangeAt(0).commonAncestorContainer.parentNode;
        if (new RegExp('^hidden',"i").test(parent.id))
            return;
        var divElement = document.getElementById(parent.id);
        var divText = $(divElement).html();
        var offset = window.getSelection().anchorOffset;
        var selectedText = "" + window.getSelection();


        var color = document.getElementById('setOutlinePicker').value;


        var newText = divText.substring(0, window.getSelection().anchorOffset) + "[outline-color="+ color +"]" + window.getSelection() + "[outline-color-restore]" + divText.substring(offset + selectedText.length, divText.length);

        $(divElement).html(newText);

        $('#hidden' + parent.id).html(parseMotkString(newText));
        $(divElement).change();

        var startNode = divElement.firstChild;

        var range = document.createRange();
        range.setStart(startNode, offset + 22);
        range.setEnd(startNode, offset + selectedText.length + 22);
        var sel = window.getSelection();


        sel.removeAllRanges();
        sel.addRange(range);
    });





    document.getElementById('dict').addEventListener('change', handleFileSelect, false);
    //document.getElementById('filter').addEventListener('change', handleFilterChange, false);
});

function updateDefaultOutlineColor(color) {
    var textColor = '#' + color;

    var elements = document.querySelectorAll('.phrase, .testText');
    var i;
    for (i = 0; i < elements.length; i++) {
        if ($('#enableOutline').is(':checked')) {
            elements[i].style.textShadow = getOutlineStyle(textColor);
        } else {
            elements[i].style.textShadow = "";
        }
    }
}

function updateDefaultTextColor(color) {
        var textColor = '#' + color;

        var elements = document.querySelectorAll('.phrase, .testText');
        var i;
        for (i = 0; i < elements.length; i++) {
            elements[i].style.color =  textColor;
        }
}

function updateBackgroundColor(color) {
        var textColor = '#' + color;

        var elements = document.querySelectorAll('.phrase, .testText');
        var i;
        for (i = 0; i < elements.length; i++) {
            if ($('#enableBackgroundColor').is(':checked')) {
                elements[i].style.backgroundColor =  textColor;
            } else {
                elements[i].style.backgroundColor =  "";
            }
        }
}

function parseMotkString(str) {
    str = str.replace(/\[icon-11\]/ig, "<img src='assets/img/icons/TypeNature.png' />");
    str = str.replace(/\[icon-10\]/ig, "<img src='assets/img/icons/TypeEnergy.png' />");
    str = str.replace(/\[icon-12\]/ig, "<img src='assets/img/icons/TypePsyonic.png' />");

    str = str.replace(/\[icon-1\]/ig, "<img src='assets/img/icons/CurrencyIconCoins42x42.png' />");
    str = str.replace(/\[icon-2\]/ig, "<img src='assets/img/icons/CurrencyIconDiamond42x42.png' />");
    str = str.replace(/\[icon-3\]/ig, "<img src='assets/img/icons/PuzzlePiece42x42.png' />");
    str = str.replace(/\[icon-8\]/ig, "<img src='assets/img/icons/TypeChaos.png' />");
    str = str.replace(/\[icon-9\]/ig, "<img src='assets/img/icons/TypeConstruct.png' />");


    str = str.replace(/\[font-color=([1234567890abcdef]{6})\]/ig, "<span style='color:#$1'>");
    str = str.replace(/\[font-color-restore\]/ig, "</span>");
    str = str.replace(/\[outline-color=([1234567890abcdef]{6})\]/ig, "<span style='text-shadow:" + getOutlineStyle("#$1") + ";'>");
    str = str.replace(/\[outline-color-restore\]/ig, "</span>");

    str = str.replace(/\[tag-n\]$/ig, "<br><br>");
    str = str.replace(/\[tag-n\]/ig, "<br>");

    return str;
}

function updateTestPhrase(color) {
    var textColor = '#' + document.getElementById('setColorPicker').value;
    var outlineColor = '#' + document.getElementById('setOutlinePicker').value;

    var testText = document.getElementsByClassName('testCustomText');
    var i;
    for (i = 0; i < testText.length; i++) {
        testText[i].style.color =  textColor;

        if ($('#enableTestOutline').is(':checked')) {
            testText[i].style.textShadow = getOutlineStyle(outlineColor);
        } else {
            testText[i].style.textShadow = "";
        }
    }
}

function getOutlineStyle(color) {
    return "2px 0px 1px "+color+", 2px 2px 1px "+color+", 0px 2px 1px "+color+", -2px 2px 1px "+color+", -2px 0px 1px "+color+", -2px -2px 1px "+color+", 0px -2px 1px "+color+", 2px -2px 1px "+color;
}

function parseToMotkString(str) {
    //str = str.replace(/<div><br><\/div>$/g, "\\n\\n");
    str = str.replace(/<div><br><\/div>/g, "\\n");
    str = str.replace(/<div>/g, "\\n");
    //str = str.replace(/<\/div>$/g, "\\n");
    str = str.replace(/<\/div>/g, "");
    str = str.replace(/&nbsp;/g, "");
    return str;
}

function addImg(type) {
    var parent = window.getSelection().getRangeAt(0).commonAncestorContainer.parentNode;
    if (new RegExp('^hidden',"i").test(parent.id))
        return;
    var divElement = document.getElementById(parent.id);
    var divText = $(divElement).html();
    var offset = window.getSelection().anchorOffset;
    var selectedText = "" + window.getSelection();

    var newText = divText.substring(0, window.getSelection().anchorOffset) + type + divText.substring(offset + selectedText.length, divText.length);

    $(divElement).html(newText);

    $('#hidden' + parent.id).html(parseMotkString(newText));
    $(divElement).change();

    var startNode = divElement.firstChild;

    var range = document.createRange();
    range.setStart(startNode, offset + type.length);
    range.setEnd(startNode, offset + type.length);
    var sel = window.getSelection();


    sel.removeAllRanges();
    sel.addRange(range);
}

function editorVersionDate() {
    return $('<div>', {id:'buildversion', text:'Ver.: ' + buildVersion + '; Last modified: ' + document.lastModified});
}
