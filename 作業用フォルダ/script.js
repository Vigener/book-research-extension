// 行と列を入れ替える
//　検索履歴の保存
//　画像がない場合などの分岐・処理を設定する。
//　UIを整える
// amazonの結果も表示する


// 本当に表示された結果は正しいのか？ > OK
dataArr = [];


async function searchBooks() {
  // $("#output").html(originalContent_output);
  console.clear()
  var key_word = document.getElementById("keyword").value;
  var google_api_key = "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(key_word) + "&printType=books&maxResults=20";

  try {
    var response = await fetch(google_api_key);
    var data = await response.json();

    console.log(data);

    var BookData = [];
    var isbn10Data = [];
    var imageLinks = [];
    var authorData = [];
    var publishedDateData = [];
    var titleData = [];
    var thumbnailData = [];

    const systemId_cityLib = "Ibaraki_Tsukuba"; //つくば市立図書館のシステムID
    const systemId_univLib = "Univ_Tsukuba"; //筑波大学附属図書館のシステムID

    const apiKey_cityLib = [];
    const apiKey_univLib = [];

    for (let i = 0; i < 20; i++) { // /^\d{10}$/.test(data.items[i].volumeInfo.industryIdentifiers[0].identifier)
      var isbnTest = data.items[i].volumeInfo.industryIdentifiers[0].type
      if (isbnTest === "ISBN_10" || isbnTest === "ISBN_13") {
        console.log(data.items[i].volumeInfo);
        BookData.push(data.items[i].volumeInfo);
      }
    }
    // console.log(BookData);

    for (let i = 0; i < (BookData.length > 3 ? 3 : BookData.length); i++) { //i < 3にすることで三冊までデータを持ってくる
      // BookData[i] = data.items[i].volumeInfo;
      isbn10Data[i] = BookData[i].industryIdentifiers[0].identifier;
      imageLinks[i] = BookData[i].imageLinks;
      authorData[i] = BookData[i].authors;
      publishedDateData[i] = BookData[i].publishedDate;
      titleData[i] = BookData[i].title;
      thumbnailData[i] = imageLinks[i] ? imageLinks[i].thumbnail : '画像なし';
      // thumbnailData[i] = imageLinks[i].thumbnail;
      // console.log(isbn10Data[i]);
      apiKey_cityLib[i] = "https://api.calil.jp/check?appkey={468b8efa42978747b9bca6d60a9c384d}&isbn=" + isbn10Data[i] + "&systemid=" + systemId_cityLib + "&callback=no";
      apiKey_univLib[i] = "https://api.calil.jp/check?appkey={468b8efa42978747b9bca6d60a9c384d}&isbn=" + isbn10Data[i] + "&systemid=" + systemId_univLib + "&callback=no";
    }

    const fetchData_cityLib = async (i) => {
      try {
        const response = await fetch(apiKey_cityLib[i]);
        const data = await response.json();

        if (data.continue === 1) {
          await fetchData_cityLib(i); // 再帰的にリクエストを行う
        } else {
          // console.log(data);
          processCityLibData(data, i);
        }
      } catch (error) {
        console.log('エラーが発生しました', error);
      }
    };

    const fetchData_univLib = async (i) => {
      try {
        const response = await fetch(apiKey_univLib[i]);
        const data = await response.json();

        if (data.continue === 1) {
          await fetchData_univLib(i); // 再帰的にリクエストを行う
        } else {
          // console.log(data);
          processUnivLibData(data, i);
        }
      } catch (error) {
        console.log('エラーが発生しました', error);
      }
    };

    var urlData = [];
    var urlList_city = [];
    var urlList_univ = [];

    var calilData_city = {};

    const processCityLibData = (data, i) => {
      var calilData_city_N = data.books[isbn10Data[i]][systemId_cityLib];
      var url_city = calilData_city_N.reserveurl;
      calilData_city[i] = calilData_city_N;
      urlList_city[i] = url_city;
    };

    var calilData_univ = {};
    // var libkeyList_univ = [];

    const processUnivLibData = (data, i) => {
      var calilData_univ_N = data.books[isbn10Data[i]][systemId_univLib];
      var url_univ = calilData_univ_N.reserveurl;
      calilData_univ[i] = calilData_univ_N;
      urlList_univ[i] = url_univ;
    };

    for (let i = 0; i < isbn10Data.length; i++) {
      fetchData_cityLib(i);
      fetchData_univLib(i);
    }

    var calilData = {
      cityLib : calilData_city,
      univLib : calilData_univ
    }

    var detail_data = {
      authorData : authorData,
      publishedDateData : publishedDateData,
      titleData : titleData,
      thumbnailData : thumbnailData,
      calilData : calilData,
      urlData_city : urlList_city,
      urlData_univ : urlList_univ
    };

    var dataObj = {
      keyword : key_word,
      detailData : detail_data
    };
    dataArr.push(dataObj);
    console.log(dataArr);
    // var dataArr_str = JSON.stringify(dataArr);
    // console.log(dataArr_str);

    // カウンタ変数を初期化
    let cityLibCount = 0;
    let univLibCount = 0;

    const fetchDataCityLib = async (i) => {
      await fetchData_cityLib(i);
      cityLibCount++; // cityLib の非同期処理が完了したらカウントアップ
      checkAndDisplayData();
    };

    const fetchDataUnivLib = async (i) => {
      await fetchData_univLib(i);
      univLibCount++; // univLib の非同期処理が完了したらカウントアップ
      checkAndDisplayData();
    };

    const checkAndDisplayData = () => {
      // 両方の非同期処理が完了し、カウントが titleData.length とそれぞれ同じになったら display_data を実行
      if (cityLibCount === titleData.length && univLibCount === titleData.length) {
        display_data(key_word, dataArr);
      }
    };

    for (let i = 0; i < isbn10Data.length; i++) {
      // cityLib と univLib の非同期処理を独立して実行
      fetchDataCityLib(i);
      fetchDataUnivLib(i);
    }

  } catch (error) {
    console.log("エラーが発生しました", error);
  }
}

//test
//表への表示を行う関数
var display_data = function(key_word,dataArr) {
  var matchingItem = dataArr.find(function(item) {
    return item.keyword === key_word;
  });
  var current_data = matchingItem ? matchingItem.detailData : null;
  for (let i = 0; i < current_data.titleData.length; i++) {
    $(`#title .data${i}`).html(current_data.titleData[i]); //本のタイトルを表示
    $(`#author .data${i}`).html(current_data.authorData[i]); //本の著者を表示
    $(`#publishDate .data${i}`).html(current_data.publishedDateData[i]); //出版年月日を表示
    var img_scr = "<img src='" + current_data.thumbnailData[i] + "'/>"; // 本の表紙をHTMLに表示
    $(`#image .data${i}`).html(img_scr);
    //蔵書状況を表示
    //URLのリンクを追加
    if (current_data.urlData_city[i]){
      $(`#lendingStatus_cityLib .data${i} .link`).attr("href", current_data.urlData_city[i]);
    }
    if (current_data.urlData_univ[i]) {
      $(`#lendingStatus_univLib .data${i} .link`).attr("href", current_data.urlData_univ[i]);
    }
    // cityLibについて
    const places_cityLib = ["中央館", "谷田部", "筑波", "小野川", "茎崎", "自動車"];
    // var places_cityLib = Object.keys(current_data.calilData.cityLib[i].libkey);
    var libkey_city = current_data.calilData.cityLib[i].libkey;
    console.log(libkey_city);
    for (let index = 0; index < 6; index++) {
      var place_cityLib = places_cityLib[index];
      console.log("ここ" + i + place_cityLib + libkey_city[place_cityLib]);
      if (libkey_city[place_cityLib] == "貸出可") {
        $(`#lendingStatus_cityLib .data${i} .${place_cityLib}`).html("◯");
      } else if (libkey_city[place_cityLib] == "貸出中") {
        $(`#lendingStatus_cityLib .data${i} .${place_cityLib}`).html("△");
      } else {
        $(`#lendingStatus_cityLib .data${i} .${place_cityLib}`).html("✕");
      }
    }
    // univLibについて
    const places_univLib = ["中央", "医学", "図情"];
    // var places_univLib = Object.keys(current_data.calilData.univLib[i].libkey);
    var libkey_univ = current_data.calilData.univLib[i].libkey;
    for (let index = 0; index < 3; index++) {
      var place_univLib = places_univLib[index];
      if (libkey_univ[place_univLib] == "貸出可") {
      $(`#lendingStatus_univLib .data${i} .${place_univLib}`).html("◯");
      } else if (libkey_univ[place_univLib] == "貸出中") {
      $(`#lendingStatus_univLib .data${i} .${place_univLib}`).html("△");
      } else {
      $(`#lendingStatus_univLib .data${i} .${place_univLib}`).html("✕");
      }
    }
  }
  // 処理が完了したら表示
  $("#output").css("visibility", "visible");
  // add();
  // readHistory();
  $("#keyword").val('');
  $("#keyword").focus();
};


// var saveStorage = function(key,his){
//   localStorage.setItem(key,JSON.stringify(his));
// };

// var getStorage = function(key){
//   var obj = localStorage.getItem(key);
//   return JSON.parse(obj);
// };

// var add = function(){
//   var key_word = $("#keyword").val();
//   var out_put = $("#output").html();
//   // console.log(out_put + "検索結果");
//   saveHistory(key_word,out_put);
// };


// var displayList = function(key_word){
//   var template = `<button type="button">${key_word}</button>`
//   $("#hisArea").append(template);
// }

// hisArr = [];
// var storageKey = 'hisObj';

// var saveHistory = function(key_word,out_put){
//   var hisObj = {
//     keyword : key_word,
//     output : out_put
//   };
//   hisArr.push(hisObj);
//   saveStorage(storageKey,hisArr);
// }

// //あとで作る　検索履歴を削除する　ボタンを作る
// var resetHistory = function(){
//   $("#hisArea").children().remove();
//   window.localStorage.clear();
// }

// var readHistory = function(){
//   var hisObjs = getStorage(storageKey);
//   if(hisObjs == null) return;
//   for (let i = 0; i < hisObjs.length; i++) {
//     var hisObj = hisObjs[i];
//     var key_word = hisObj.keyword;
//     var out_put = hisObj.output;
//     var hisObj = {
//       keyword : key_word,
//       output : out_put
//     };
//     hisArr.push(hisObj);
//     saveStorage(storageKey,hisArr);
//     displayList(key_word,out_put);
//     // console.log(hisObjs);
//   }
// };
//test


$(document).ready(function() {
  $("#output").css("visibility", "hidden");
  $("#keyword").focus();
  // readHistory();
});

// var originalContent_output = $("#output").html(); //初期状態を保存しておく

$("#begin_search").click(function() {
  searchBooks();
});

$("#keyword").keypress(function(event) {
  if (event.key === "Enter") {
    searchBooks();
  }
});

// $("#hisArea").on("click", "button", function(){
//   // displayHistory();
//   var current_key = $(this).text();
//   var matchingItem = hisArr.find(function(item) {
//     return item.keyword === current_key;
//   });
//   var current_data = matchingItem ? matchingItem.output : null;
//   $("#output").children().remove();
//   $("#output").html(current_data);
// }); //クリックされたときに過去の検索結果を表示する

// $("#btnReset").on('click',function(){
//   resetHistory();
// })


// window.onload = function() {
//   document.getElementById("output").style.visibility = "hidden";
//   document.getElementById('keyword').focus();
// };

// document.getElementById("begin_search").addEventListener("click", searchBooks);
// document.getElementById("keyword").addEventListener("keypress", function(event) {
//   if (event.key === "Enter") {
//     searchBooks();
//   }
// });


///感想
// APIで取得してくるデータの形式が毎回同じとは限らないため、そのための場合分けや処理の仕方を考えるのが難しかった。
//　jsonファイル？の扱いにある程度詳しくなれた
// データをリスト化するときにとりあえず使えればいいという観点で取得してしまったため、そのまとまったデータだけ見ると分かりづらい（他のことがしたいときに応用が効かない）となってしまった。データの扱いについても正しく学び実践することが必要だと感じた.
