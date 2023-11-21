const str = {"session":"e3403598c19d887f58c7f740013cb4170a5061017b2863b44fd73d4219b2b050","continue":0,"books":{"4106108828":{"Univ_Tsukuba":{"status":"OK","libkey":{"中央":"貸出可","医学":"貸出可","図情":"貸出可"},"reserveurl":"https://www.tulips.tsukuba.ac.jp/opac/volume/3934595"},"Ibaraki_Tsukuba":{"status":"OK","libkey":{"中央館":"貸出可","谷田部":"貸出可","筑波":"貸出可","小野川":"貸出中","茎崎":"貸出可","自動車":"貸出可"},"reserveurl":"https://ilisod010.apsel.jp/lib-city-tsukuba/item-details?id=2513482"}}}};
const json_str = JSON.stringify(str);
const systemID = {
    つくば市立図書館: "Ibaraki_Tsukuba",
    筑波大学付属図書館: "Univ_Tsukuba"
  };
const isbnData = ["4106108828","4866673869","4315527572"]

const d = str.books[isbnData[0]][systemID["つくば市立図書館"]].libkey;
console.log(d);
