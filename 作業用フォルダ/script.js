// 行と列を入れ替える
//　検索履歴の保存
//　画像がない場合などの分岐・処理を設定する。
//　UIを整える
// amazonの結果も表示する

//　か-リルAPIの開発元が信頼できるかどうか
//　実際の情報と一致していることを見せる（発表時）

// 同じキーワードで検索した際に一番最新のデータが持ってこれたら嬉しい
// dataを取得した時間も表示したい

// 問題点>>>
//キーワードのはじめに空白が入っているとidの設定がうまく行かず、結果が表示されない

//取得時間、✕のみの本を表示しない、空白処理・idの付けかた工夫する



// 本当に表示された結果は正しいのか？ > OK
const originalContent = $("#output_table").clone();
const originalContent_keyword_area = $("#display_search_keyword").html();
const originalContent_template = $("#template").html(); //テンプレートを保存しておく。リロードしてもデータを残したりするならローカルストレージに置く必要がありそう
const dataArr = [];

const systemID = {
  つくば市立図書館: "Ibaraki_Tsukuba",
  筑波大学付属図書館: "Univ_Tsukuba"
}; //ここに追加する。


async function searchBooks() {
  var userInput = document.getElementById("keyword").value;
  var key_word = userInput.replace(/[\s　]/g, "_");
  const dataObj = {
    keyword: key_word,
    detailData: {
      BookData: [],
      calilData: []
    }
  };
  
  // $("#output").html(originalContent_output);
  console.clear()
  var google_api_key = "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(userInput) + "&printType=books&maxResults=20";
  // console.log(google_api_key);
  try {
    var response = await fetch(google_api_key);
    var data = await response.json();


    const BookData = dataObj.detailData.BookData;
    const calilData = dataObj.detailData.calilData;
    const isbnData = [];

    for (let i = 0; i < 20; i++) { // /^\d{10}$/.test(data.items[i].volumeInfo.industryIdentifiers[0].identifier)
      var isbnTest = null;
      function checkImageLinks(data) {
        for (let i = 0; i < data.items.length; i++) {
          if (data.items[i].volumeInfo.hasOwnProperty('imageLinks')) {
            // imageLinksオブジェクトが存在する場合の処理
            BookData.push(data.items[i].volumeInfo);
          }
        }
      }
      const check_isbn = data.items[i].volumeInfo.industryIdentifiers;
      if (check_isbn && check_isbn.length > 0) {
        isbnTest = check_isbn[0].type;
      }
      if (isbnTest === "ISBN_10" || isbnTest === "ISBN_13") {
        checkImageLinks(data);
      }
    }
    const bookData_json = BookData
    console.log("これはbookdataです");
    console.log(bookData_json);
    //検索できるbookdataがあるかどうか確認
    if (BookData == []) {
      $("#console").html("検索できる本がありませんでした。");
    }

    const fetch_calil = async (apiKey) => {
      try {
        const response = await fetch(apiKey);
        const data = await response.json();
        if (data.continue === 1) {
          return fetch_calil(apiKey); // 再帰的にリクエストを行う
        } else {
          calilData.push(data);
          const obtained_time = (() => {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${month}/${day} ${hours}:${minutes}`;
          })();
          dataObj.obtained_time = obtained_time; // Add obtained_time to dataObj
          dataArr.push(dataObj);
          console.log(dataArr);
          // Save dataObj to local storage
          localStorage.setItem(dataObj.keyword, JSON.stringify(dataObj));

          display_data(userInput, key_word, obtained_time, dataArr, isbnData);
        }
      } catch (error) {
        console.log('エラーが発生しました', error);
      }
    };

    const len_Data = BookData.length
    const num_of_display = len_Data > 3 ? 3 : len_Data; //　何冊の本を検索結果として表示するか設定
    for (let i = 0; i < num_of_display; i++) {
      isbnData[i] = BookData[i].industryIdentifiers[0].identifier;
      if (i == num_of_display - 1) {
        const ISBN_list = isbnData.join(',');
        const SYSTEM_ID_list = Object.values(systemID).join(','); //検索したい図書館のシステムIDを,で区切りながら羅列する
        const apiKey = "https://api.calil.jp/check?appkey={468b8efa42978747b9bca6d60a9c384d}&isbn=" + ISBN_list + "&systemid=" + SYSTEM_ID_list + "&callback=no";
        await fetch_calil(apiKey);
      }
    }

  } catch (error) {
    console.log("エラーが発生しました", error);
  }
}



//test
//表への表示を行う関数
const display_data = function (userInput, key_word, obtained_time, dataArr, isbnData) {
  const matchingItem = dataArr.find(function (item) {
    return item.keyword === key_word && item.obtained_time === obtained_time;
  });
  const current_data = matchingItem ? matchingItem.detailData : null;
  console.log(current_data);
  // console.log(current_data.calilData[0].books);
  const display_count = Object.keys(current_data.calilData[0].books).length;
  let displayArea = $('#template').clone();
  displayArea.attr("id", '');
  displayArea.attr("class", `${key_word}`);
  $("#output").prepend(displayArea);
  // //検索キーワードを表示するヘッダーを作成
  // let clonedKeywordArea = $('#display_search_keyword').clone(); //「」の検索結果　と表示するエリアをクローン
  // clonedKeywordArea.attr("class", `${key_word}`);
  // $("#output_table").append(clonedKeywordArea);
  console.log(key_word);
  test = $(`.${key_word} .keyword_area`).html();
  console.log(test);
  $(`.${key_word} .keyword_area .keyword_header`).html("「" + userInput + "」の検索結果 (取得時間: " + obtained_time + ")");
  //それぞれの本のデータを表示
  $(`.${key_word} .book_data_area`).remove();
  for (let i = 0; i < display_count; i++) {
    let clonedElement = $(`#template .book_data_area`).clone();
    clonedElement.attr("id", '');
    clonedElement.attr("class", `data${i}_${key_word}`);
    $(`.${key_word}`).append(clonedElement);
    // let clonedElement = $("#template").clone(); //テンプレートをクローン
    // clonedElement.attr("id", `data${i}`); //IDを変更
    // $("#output_table").append(clonedElement); //クローンした要素を追加
    if (current_data.BookData[i].imageLinks.thumbnail) {
      var img_scr = "<img src='" + current_data.BookData[i].imageLinks.thumbnail + "'/>"; // 本の表紙をHTMLに表示
      $(`.data${i}_${key_word} .image`).html(img_scr);
    }
    $(`.data${i}_${key_word} .title`).html(current_data.BookData[i].title); //本のタイトルを表示
    $(`.data${i}_${key_word} .author`).html("著者: " + current_data.BookData[i].authors); //本の著者を表示
    $(`.data${i}_${key_word} .publishDate`).html("出版年月日: " + current_data.BookData[i].publishedDate); //出版年月日を表示
    //蔵書状況を表示
    //URLのリンクを追加
    // const link_cityLib =
    $(`.data${i}_${key_word} .ls_area .lendingStatus_cityLib .link`).attr("href", current_data.calilData[0].books[isbnData[i]].Ibaraki_Tsukuba.reserveurl);
    $(`.data${i}_${key_word} .ls_area .lendingStatus_univLib .link`).attr("href", current_data.calilData[0].books[isbnData[i]].Univ_Tsukuba.reserveurl);
    // cityLibについて
    const places_cityLib = ["中央館", "谷田部", "筑波", "小野川", "茎崎", "自動車"];
    const libkey_city = current_data.calilData[0]["books"][isbnData[i]][systemID["つくば市立図書館"]].libkey;
    // console.log(libkey_city);
    for (let index = 0; index < 6; index++) {
      var place_cityLib = places_cityLib[index];
      if (libkey_city[place_cityLib] == "貸出可") {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("◯");
      } else if (libkey_city[place_cityLib] == "貸出中") {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("△");
      } else {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("✕");
      }
    }
    // univLibについて
    const places_univLib = ["中央", "医学", "図情"];
    // var places_univLib = Object.keys(current_data.calilData.univLib[i].libkey);
    var libkey_univ = current_data.calilData[0].books[isbnData[i]][systemID["筑波大学付属図書館"]].libkey;
    for (let index = 0; index < 3; index++) {
      var place_univLib = places_univLib[index];
      if (libkey_univ[place_univLib] == "貸出可") {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("◯");
      } else if (libkey_univ[place_univLib] == "貸出中") {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("△");
      } else {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("✕");
      }
    }
  }
  // 書込み後、templateを削除
  // $("#display_search_keyword").remove();
  // $("#template").remove();
  // $(`.${key_word} #book_data_area`).remove();
  // 処理が完了したら表示
  $("#output").css("visibility", "visible");
  // add();
  // readHistory();
  $("#keyword").val('');
  $("#keyword").focus();
};



// var saveStorage = function (key, his) {
//   localStorage.setItem(key, JSON.stringify(his));
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


$(document).ready(function () {
  // $("#output").css("visibility", "hidden");
  $("#keyword").focus();
  // readHistory();
});

// var originalContent_output = $("#output").html(); //初期状態を保存しておく

$("#begin_search").click(function () {
  searchBooks();
});

$("#keyword").keypress(function (event) {
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
