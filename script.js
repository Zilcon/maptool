// ===== グローバル変数 =====
let loginname = ""; 
let pagename = [];
let maprows = [];
let countryall = [];
let color = "#FFFFFF"; 
let selectedPage = null;

// ★建国機能用の変数を追加
let isCreatingCountry = false; // 建国モード中かどうかのフラグ
let newCountryInfo = { name: '', color: '' }; // 作成する国の情報
let selectedPathsForNewCountry = []; // 建国のために選択したマスのIDを保持

// ===== データ取得と初期設定 =====
fetch("https://script.google.com/macros/s/AKfycbydW0rThl8H18R1m00zzBZYiTXoe-jCq0ut-QCY_YS4gG2HfvEP8x2K1lAx3AXNOc28Mg/exec") // ※ご自身のGASのURLに書き換えてください
  .then(res => res.ok ? res.json() : Promise.reject(new Error('Network response was not ok.')))
  .then(data => {
    console.log("取得したデータ:", data);
    const map = data["MapData"];
    const country = data["CountryData"];

    pagename = map[0]; 
    maprows = map.slice(1);
    countryall = country;

    // UI要素の初期化
    setupUI();
    // 地図の初期表示
    initialMapRender();
  })
  .catch(error => {
    console.error('データの取得に失敗しました:', error);
    alert('データの取得に失敗しました。ページを再読み込みしてください。');
  });

function displayPathInfo(pathData) {
    const infoBox = document.getElementById("infoBox");
    if (infoBox) {
        infoBox.innerHTML = `<ul>${pathData.map(item => `<li>${item}</li>`).join("")}</ul>`;
    }
}

function createPageButton(buttonName) {
  const btn = document.createElement("button");
  btn.innerText = buttonName;
  btn.onclick = function() {
    selectedPage = buttonName;
    alert(`「${buttonName}」タブを選択しました。`);
    document.querySelectorAll('#button-container button').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  };
  const container = document.getElementById("button-container");
  if (container) {
    container.appendChild(btn);
  }
}

function setupUI() {
    // タブ選択ボタンを生成
    pagename.forEach(name => createPageButton(name));
    
    // 地図の各マスにクリックイベントを設定
    document.querySelectorAll("svg path").forEach(path => {
        path.addEventListener("click", handleMapClick);
    });

    // 建国ボタンにクリックイベントを設定
    const createCountryBtn = document.getElementById('create-country-btn');
    if (createCountryBtn) {
        createCountryBtn.addEventListener('click', handleCreateCountryBtnClick);
    }
}

function handleMapClick(event) {
    const path = event.currentTarget;
    const datapath = path.id;
    const rowIndex = maprows.findIndex(row => row[0] === datapath);
    const countryColIndex = pagename.indexOf("国"); // 「国」列のインデックス

    // 1. まずクリックされたマスの情報を表示する (データ表示機能)
    if (rowIndex !== -1) {
        displayPathInfo(maprows[rowIndex]);
    } else {
        document.getElementById("infoBox").innerHTML = `<p>${datapath}のデータは見つかりませんでした。</p>`;
        return; // データがない場合は以降の処理を中断
    }

    // 2. 建国モード中の処理
    if (isCreatingCountry) {
        // 「国」列が空欄（空きマス）かチェック
        if (countryColIndex !== -1 && maprows[rowIndex][countryColIndex]) {
            alert("このマスは既に「" + maprows[rowIndex][countryColIndex] + "」の領土です。空きマスを選択してください。");
            return;
        }

        // 選択/選択解除の処理
        if (selectedPathsForNewCountry.includes(datapath)) {
            // 既に選択済みの場合は選択解除
            selectedPathsForNewCountry = selectedPathsForNewCountry.filter(id => id !== datapath);
            path.style.stroke = ''; // 枠線を元に戻す
            path.style.strokeWidth = '';
        } else {
            // 未選択の場合は選択
            selectedPathsForNewCountry.push(datapath);
            path.style.stroke = 'yellow'; // 選択中であることがわかるように黄色い枠線をつける
            path.style.strokeWidth = '3px';
        }
        console.log("選択中のマス:", selectedPathsForNewCountry);
        return; // 建国モード中は色塗り処理を行わない
    }

    // 3. 通常の編集（色塗り・データ更新）モードの処理
    if (!loginname || !selectedPage) {
        // ログインしていない、またはタブが選択されていない場合は、データ表示のみで終了
        return;
    }

    // (既存の編集処理...)
    if (selectedPage === "国") {
      this.style.fill = color;
      maprows[rowIndex][countryColIndex] = loginname;
    } else {
      const inputValue = prompt("1から100までの数値を入力してください。", "50");
      if (inputValue === null || inputValue === "") return;
      const numValue = parseInt(inputValue, 10);
      if (isNaN(numValue) || numValue < 1 || numValue > 100) {
          alert("1から100の範囲で数値を入力してください。");
          return;
      }
      const gradientColor = getGradientColor(numValue);
      this.style.fill = gradientColor;
      const colIndex = pagename.indexOf(selectedPage);
      maprows[rowIndex][colIndex] = numValue;
    }
    // 更新後の情報を再表示
    displayPathInfo(maprows[rowIndex]);
}

/**
 * ★建国ボタンがクリックされたときの処理
 */
function handleCreateCountryBtnClick() {
    const btn = document.getElementById('create-country-btn');
    isCreatingCountry = !isCreatingCountry; // モードを切り替え

    if (isCreatingCountry) {
        // 建国モード開始
        const countryName = prompt("建国する国の名前を入力してください:");
        if (!countryName) {
            isCreatingCountry = false; // 国名が入力されなければモード解除
            return;
        }
        if (countryall.some(row => row[0] === countryName)) {
            alert("その国名は既に使用されています。");
            isCreatingCountry = false;
            return;
        }

        newCountryInfo.name = countryName;
        newCountryInfo.color = getRandomColor(); // ランダムな色を生成
        selectedPathsForNewCountry = []; // 選択マスをリセット

        btn.innerText = '選択を完了して建国する';
        btn.style.backgroundColor = '#ffc107';
        alert(`「${countryName}」を建国します。マップ上の空きマスを選択してください。`);

    } else {
        // 建国モード完了
        if (selectedPathsForNewCountry.length === 0) {
            alert("建国するマスが選択されていません。建国を中止します。");
        } else {
            const countryColIndex = pagename.indexOf("国");
            if (countryColIndex === -1) {
                alert("エラー:「国」データ列が見つかりません。");
                return;
            }

            // データ(maprows, countryall)を更新
            selectedPathsForNewCountry.forEach(pathId => {
                const rowIndex = maprows.findIndex(row => row[0] === pathId);
                if (rowIndex !== -1) {
                    maprows[rowIndex][countryColIndex] = newCountryInfo.name;
                    // 地図の見た目を更新
                    const pathElement = document.getElementById(pathId);
                    if (pathElement) {
                        pathElement.style.fill = newCountryInfo.color;
                        pathElement.style.stroke = ''; // 枠線を元に戻す
                        pathElement.style.strokeWidth = '';
                    }
                }
            });
            countryall.push([newCountryInfo.name, newCountryInfo.color]);
            
            alert(`「${newCountryInfo.name}」が建国されました！忘れずに「サーバーに保存」ボタンを押してください。`);
            // ★（推奨）ここで自動的にsaveData()を呼ぶようにしても良い
            // saveData();
        }

        btn.innerText = '建国';
        btn.style.backgroundColor = '';
        selectedPathsForNewCountry = []; // 選択をリセット
    }
}

// ===== ログイン処理 =====
function handleLogin(e) {
  e.preventDefault();
  const loginInput = document.getElementById("Login").value;
  const userRow = countryall.find(row => row[0] === loginInput);

  if (userRow) {
    loginname = userRow[0]; 
    color = userRow[1];     
    alert(loginname + "さん、ようこそ！");
    const loginStatusEl = document.getElementById('loginStatus');
    if (loginStatusEl) {
        loginStatusEl.innerText = `ログイン中: ${loginname}`;
    }
  } else {
    alert("ログインに失敗しました。ユーザー名を確認してください。");
  }
}

// ===== 地図のクリックイベント（★色塗りロジックを修正）=====
document.querySelectorAll("svg path").forEach(path => {
  path.addEventListener("click", function () {
    if (!loginname) {
      alert("先にログインしてください。");
      return;
    }
    if (!selectedPage) {
      alert("更新したい項目（タブ）をクリックして選択してください。");
      return;
    }
    
    const datapath = this.id;
    const rowIndex = maprows.findIndex(row => row[0] === datapath);
    const colIndex = pagename.indexOf(selectedPage);

    if (rowIndex === -1 || colIndex === -1) {
      console.error("更新対象のデータが見つかりませんでした。");
      return;
    }

    // ★タブの種類によって色と保存するデータを変更
    if (selectedPage === "国") { // タブ名が「国」の場合
      // ログインユーザーの色で塗る
      this.style.fill = color;
      // データにはログイン名を保存
      maprows[rowIndex][colIndex] = loginname;
      console.log(`データ更新: ${datapath}の「${selectedPage}」を「${loginname}」に更新しました。`);

    } else { // 「国」以外のタブの場合
      // 数値を入力させる
      const inputValue = prompt("1から100までの数値を入力してください。", "50");
      if (inputValue === null || inputValue === "") { // キャンセルまたは空の場合は何もしない
          return;
      }

      const numValue = parseInt(inputValue, 10);
      if (isNaN(numValue) || numValue < 1 || numValue > 100) {
          alert("1から100の範囲で数値を入力してください。");
          return;
      }
      
      // 入力値に応じたグラデーションカラーを取得して塗る
      const gradientColor = getGradientColor(numValue);
      this.style.fill = gradientColor;
      // データには入力された数値を保存
      maprows[rowIndex][colIndex] = numValue;
      console.log(`データ更新: ${datapath}の「${selectedPage}」を「${numValue}」に更新しました。`);
    }

    // 更新後の情報を表示
    displayPathInfo(maprows[rowIndex]);
  });
});

/**
 * ★追加：数値(1-100)に基づいてグラデーションカラーを返す関数
 * 1に近いほど緑、100に近いほど赤になります。
 * @param {number} value - 1から100までの数値
 * @returns {string} HSL形式のカラーコード
 */
function getGradientColor(value) {
    // HSL色空間を利用: H(色相), S(彩度), L(輝度)
    // 色相を緑(120)から赤(0)へ変化させる
    const hue = 120 - (value - 1) * (120 / 99);
    return `hsl(${hue}, 100%, 50%)`;
}

// ===== 既存のヘルパー関数（変更なし）=====


// ===== ヘルパー関数群 =====

/**
 * ★データ表示機能を改善
 * ヘッダー名と値をセットで表示するように変更
 */
function displayPathInfo(pathData) {
    const infoBox = document.getElementById("infoBox");
    if (infoBox) {
        let listItems = pagename.map((header, index) => {
            const value = pathData[index] || '（データなし）';
            return `<li><strong>${header}:</strong> ${value}</li>`;
        }).join('');
        infoBox.innerHTML = `<h3>${pathData[0]}の情報</h3><ul>${listItems}</ul>`;
    }
}

/**
 * ★ランダムな16進数カラーコードを生成する関数
 * @returns {string} 例: '#3a86ff'
 */
function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

async function saveData() {
  if(!confirm("現在の変更をサーバーに保存しますか？")) return;
  
  // ★建国で追加された国情報も保存データに含める
  const mapDataToSave = [pagename, ...maprows];
  const countryDataToSave = countryall; // ヘッダーなしの想定
  
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbydW0rThl8H18R1m00zzBZYiTXoe-jCq0ut-QCY_YS4gG2HfvEP8x2K1lAx3AXNOc28Mg/exec", { // ※ご自身のGASのURLに書き換えてください
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ★GAS側で両方のデータを受け取れるように形式を調整
      body: JSON.stringify({ MapData: mapDataToSave, CountryData: countryDataToSave }),
    });
    if (!response.ok) throw new Error('サーバーへの送信に失敗しました。');
    const result = await response.json();
    console.log("保存成功:", result);
    alert("データを保存しました。");
  } catch (error) {
    console.error('保存エラー:', error);
    alert('データの保存に失敗しました。');
  }
}

/**
 * ★修正：初期表示の際も、タブの種類に応じた色分けをする
 */
function initialMapRender() {
    maprows.forEach(row => {
        const pathId = row[0];
        if (!pathId) return;

        const path = document.getElementById(pathId);
        if (!path) return;

        // 各データ列をチェック
        for (let i = 1; i < row.length; i++) {
            const cellValue = row[i];
            const tabName = pagename[i];
            
            if (cellValue) {
                if (tabName === "国") {
                    const userRow = countryall.find(c => c[0] === cellValue);
                    if (userRow) {
                        path.style.fill = userRow[1];
                        break; // 国の色を優先して塗ったら、この地域の処理は終了
                    }
                } else {
                    const numValue = parseInt(cellValue, 10);
                    if (!isNaN(numValue)) {
                        path.style.fill = getGradientColor(numValue);
                        // ここではbreakしないことで、後の列のデータで上書きも可能
                        // 仕様に応じてbreakを入れても良い
                    }
                }
            }
        }
    });
}
