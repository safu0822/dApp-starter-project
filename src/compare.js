//App.js
//フロントエンド側
import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
const App = () => {
  /*ユーザーのパブリックウォレットを保持するために使用する状態変数を定義する。*/
  const [currentAccount, setCurrentAccount] = useState("");
  /*ユーザーメッセージを保存するために使用する状態変数を定義する*/
  const [messageValue, setMessageValue] = useState("");
  /*すべてのwavesを保存する状態変数を定義する*/
  const [allWaves, setAllWaves] = useState([]);
  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);

  // デプロイされたコントラクトのアドレスを保持する変数を作成
  const contractAddress = "0xBE5DE0e248A1B1F9bE1FBb84af9208227cBd33D6";
  //ABIの中身を参照する変数を作成
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        //provider=(MetaMask)を取得。フロントエンドがMetaMaskを買いしてイーサリアムノードに接続できる。
        const provider = new ethers.providers.Web3Provider(ethereum);
        //ユーザーのMetaMaskのウォレットアドレスを取得
        const signer = provider.getSigner();
        //コントラクトのインスタンスを作成して、コントラクトへ接続する。詳細はwave関数のとこ見て
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        /*コントラクトからgetAllWavesメソッドを呼び出す*/
        const waves = await wavePortalContract.getAllWaves();

        /*UIに必要なのは、アドレス、タイムスタンプ、メッセージだけなので以下のように設定*/
        //.map()メソッドでwaves配列をループし、配列内の各項目要素を返している。
        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: (new Date(wave.timestamp * 1000)).toString(),
            message: wave.message,
          };
        });

        /*React Stateにデータを格納する*/
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**emitされたイベントに反応する */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: (new Date(timestamp * 1000)).toString(),
          message: message,
        },
      ]);
    };

    /**NewWaveイベントがコントラクトから発信されたときに情報を受け取る */
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    /**メモリリークを防ぐためにNewWaveのイベントを解除 */
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  /*window.ethereumにアクセスできることを確認する*/
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("MAke sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*ユーザーのウォレットへのアクセスが許可されているかどうかを確認します*/
      // accountsにWEBサイトを訪れたユーザーのウォレットアカウントを格納する（複数持っている場合も加味、よって account's' と変数を定義している）
      const accounts = await ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length !== 0) {
        // accountという変数にユーザーの1つ目（=Javascriptでいう0番目）のアドレスを格納
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        // currentAccountにユーザーのアカウントアドレスを格納
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      // アカウントが存在しない場合は、エラーを出力。
      console.log(error);
    }
  };
  //connectWalletメソッドを実装
  const connectWallet = async () => {
    try {
      //ユーザーが認証可能なウォレットを持っているか確認
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get Wallet!");
        return;
      }
      //認証可能ウォレットを持っている場合
      //ユーザーに対してアクセス許可を求める。許可された場合は、
      //ユーザーの最初のウォレットアドレスをcurrentAccountに格納する。
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected:", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      //ユーザーがメタマスク持っているか確認
      const { ethereum } = window;
      if (ethereum) {
        //ここでは、provider (= MetaMask) を設定しています。 provider を介して、ユーザーはブロックチェーン上に存在するイーサリアムノードに接続することができます。
        const provider = new ethers.providers.Web3Provider(ethereum);

        //signer は、ユーザーのウォレットアドレスを抽象化したものです。
        //provider を作成し、provider.getSigner() を呼び出すだけで、ユーザーはウォレットアドレスを使用してトランザクションに署名し、そのデータをイーサリアムネットワークに送信することができます。
        const signer = provider.getSigner();

        //コントラクトの新しいインスタンスを作成するには、以下 3 つの変数を ethers.Contract 関数に渡す必要がある。
        //コントラクトのデプロイ先のアドレス（ローカル、テストネット、またはイーサリアムメインネット）
        //コントラクトの ABI
        // provider、もしくは signer
        //コントラクトインスタンスでは、コントラクトに格納されているすべての関数を呼び出すことができる
        //このコントラクトインスタンスに signerではなくprovider を渡すと、そのインスタンスは読み取り専用の機能しか実行できなくなる
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let count = await wavePortalContract.getTotalWave (messageValue, {
          gasLimit: 300000,
        });
        console.log("Retrieved total wave count...", count.toNumber());

        //コントラクトに(wave)を書き込む
        const waveTxn = await wavePortalContract.wave();
        console.log("Minting...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Minted--", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };
  /*
   *webページがロードされたときに下記の関数を実行する
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">
            👋
          </span>{" "}
          WELCOME!
        </div>
        <div className="bio">
          イーサリアムウォレットを接続して、メッセージを作成したら、「
          <span role="img" aria-label="hand-wave">
            👋
          </span>
          (wave)」を送ってください
          <span role="img" aria-label="shine">
            ✨
          </span>
        </div>

         {/* メッセージボックスを実装*/}
         {currentAccount && (
          <textarea
            name="messageArea"
            placeholder="メッセージはこちら"
            type="text"
            id="message"
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
          />
        )}
        {/* ウォレットコネクトボタンを実装*/}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            connectWallet
          </button>
        )}
        {currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Wallet Connected
          </button>
        )}
        {/* waveボタンにwave関数を連動 */}
        {currentAccount && (
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
        )}
       
        {/* 履歴を表示する */}
        {currentAccount &&
          allWaves
            .slice(0)
            .reverse()
            .map((wave, index) => {
              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#F8F8FF",
                    marginTop: "16px",
                    padding: "8px",
                  }}
                >
                  <div>Address: {wave.address}</div>
                  <div>Time: {wave.timestamp.toString()}</div>
                  <div>Message: {wave.message}</div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
export default App;
