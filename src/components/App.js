import React, {createRef, useCallback, useEffect, useState} from 'react';
import './App.css';
import Web3 from 'web3';
import ElectionJSON from '../abis/Election';
import NavigationBar from "./NavigationBar";

function App() {

  // State variables

  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [electionInstance, setElectionInstance] = useState(null);
  const [userData, setUserData] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [subbedToEvents, setSubbedToEvents] = useState(false);
  const [newVoteSub, setNewVoteSub] = useState(null);
  const [newCandidateSub, setNewCandidateSub] = useState(null);
  const [candidatesList, setCandidatesList] = useState([]);
  const [voteLoading, setVoteLoading] = useState(false);

  // References

  const candidateNameInputRef = createRef();

  // useEffect hooks

  useEffect(() => {
    initConnection();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

  }, []);

  useEffect(() => {
    if (newVoteSub && newCandidateSub){
      newVoteSub.unsubscribe();
      newCandidateSub.unsubscribe();
    }
  }, [account]);


  useEffect(() => {
    if (userData.candidateName && !subbedToEvents){
      subscribeToContractEvents(electionInstance, userData, account);
    }
  }, [userData]);


  /*const checkIfSameAccount = useCallback((accountToCheck) => {
    console.log("CALLBACK called");
    console.log("to check: ");
    console.log(accountToCheck);
    console.log("current");
    console.log(account);
    if (account === accountToCheck.toLowerCase()) {
      console.log("IS");
      return true;
    }
    console.log("IS NOT");
    return false;
  }, [account]);
*/

  // Helper functions

  const checkIfSameAccount = (accountToCheck) => {
    if (account === accountToCheck.toLowerCase()) {
      return true;
    }
    return false;
  };

  // Event handlers

  const handleAccountsChanged = (newAccounts) => {
    setAccount(null);
    setUserData({});
    setSubbedToEvents(false);
  };

  const subscribeToContractEvents  = () => {

    setSubbedToEvents(true);

    // fired when new vote towards user is cast
    let votesub = electionInstance.events.NewVote().on("data", (result) => {
      loadUserData(electionInstance, account);
    });

    setNewVoteSub(votesub);

    // fired when user registers as candidate
    let candsub = electionInstance.events.NewCandidate().on("data", (result) => {
      let newCandAddress = result.returnValues.candidateAddress;
      if (checkIfSameAccount(newCandAddress)) {
        loadUserData(electionInstance, newCandAddress);
      }
      getAllCandidates(electionInstance);
    });

    setNewCandidateSub(candsub);

  };


  // Component methods

  const initConnection = () => {
    if (typeof window.ethereum !== "undefined" && !web3) {
      let currentWeb3 = new Web3(window.ethereum);
      setWeb3(currentWeb3);
    } else {
      window.alert("Please install MetaMask to use this app.");
    }
  };


  const connectToContract = async () => {
    setIsLoading(true);
    let abi = ElectionJSON.abi;
    let netId = await web3.eth.net.getId();
    let address = ElectionJSON.networks[netId].address;
    let inst = new web3.eth.Contract(abi, address);
    setElectionInstance(inst);
    return inst;
  };

  const getAllCandidates = async (inst) => {
    // Getting the list of candidates
    let totalCandidates = parseInt(await inst.methods.candidatesCount().call());

    let temparr = [];

    for (let i=0;i<totalCandidates;i++){
      let tempCand = await inst.methods.candidates(i).call();
      temparr.push(tempCand);
    }
    setCandidatesList(temparr);
  };

  const loadUserData = async (inst, userAddress) => {
    const currentData = {};
    let regStatus = await inst.methods.isCandidate(userAddress).call();
    currentData.hasRegistered = regStatus[0];
    currentData.candidateName = regStatus[1];
    currentData.candidateId = parseInt(regStatus[2]);

    if (currentData.hasRegistered) {
      currentData.candidateVoteCount = parseInt(await inst.methods.getResultsByCandidate(currentData.candidateId).call());
    }

    currentData.hasVoted = await inst.methods.voters(userAddress).call();

    if (currentData.hasVoted) {
      currentData.hasVotedFor = await inst.methods.votedForRecord(userAddress).call();
    }

    await getAllCandidates(inst);

    setIsLoading(false);
    setRegisterLoading(false);
    setUserData(currentData);
    return currentData;

  };

  const registerAsCandidate = () => {
    let nameTBR = candidateNameInputRef.current.value;
    if (registerLoading || nameTBR === ""){
      return null;
    }
    setRegisterLoading(true);
    electionInstance.methods.registerAsCandidate(nameTBR).send({from: account}).catch(err => {
      if (err.code !== 4001) {
        console.log(err);
      }
      setRegisterLoading(false);
    });
  };


  const submitVote = (id) => {

    electionInstance.methods.vote((id + 1).toString()).send({from: account}).catch(err => {
      if (err.code !== 4001) {
        console.log(err);
      }
    });
  };


  // Methods to be passed as props

  const connectToAccount = () => {
    let account;
    let contractInstance;
    window.ethereum.request({method: "eth_requestAccounts"}).then(async accounts => {
      account = accounts[0];
      setAccount(accounts[0]);
      return connectToContract();
    }).then(async (elInst) => {
      contractInstance = elInst;
      return loadUserData(elInst, account);
    })
      // .then((currentData) => {
      // subscribeToContractEvents(contractInstance, currentData, account);
    // })
      .catch(err => {
        if (err.code === 4001) {
          console.log("Please accept the MetaMask login to continue.");
        } else {
          console.log(err);
        }
      });
  };

  // UI functions

  const renderConnectionMessage = () => {
    if (!account) {
      return <h1 className="please-connect">Please connect your MetaMask account to continue.</h1>
    }
    return <h1 className="please-connect black-connect">Please connect your MetaMask account to continue.</h1>
  };

  const renderRegisterPanel = () => {
    if (account && !isLoading) {
      let headerMessage = (userData.hasRegistered)? "Hello, " + userData.candidateName + "." : "Register as a candidate";
      let correctVoteWord = (userData.candidateVoteCount === 1)? "vote" : "votes";

      return (<div className={"main-side main-side-animation"}>
          <h4 className={"main-side-header"}>{headerMessage}</h4>
          <div className={"register-form"}>
            {(userData.hasRegistered)?
            <p className="results-text">You have <span>{userData.candidateVoteCount}</span> {correctVoteWord}.</p>
              :<div>
                <input type="text" className={"name-field"} ref={candidateNameInputRef} placeholder={"Enter your name here..." }/><br/>
                {(registerLoading)?
                  <button type={"submit"} onClick={registerAsCandidate} className={"register-button register-loading"}><span>Loading...</span></button>
                  :
                  <button type={"submit"} onClick={registerAsCandidate} className={"register-button"}>Register</button>
                }
              </div>
            }
          </div>
        </div>
      );
    }
  };

  const renderVotePanel = () => {
    if (account && !isLoading) {
      let voteHeader = (userData.hasVoted)? "You have already voted for: " : "Vote";
      let alreadyVotedClass = (userData.hasVoted)? "" : " vote-header";
      return (
        <div className={"main-side tempref main-side-animation"}>
          <h4 className={"main-side-header" + alreadyVotedClass}>{voteHeader}</h4>
          {(!userData.hasVoted)?
          <ul className="candidates-list">
          {(candidatesList.length > 0)? candidatesList.map((cand, i) => {
            return <li key={i} data-key={i} className="candidate-element" onClick={() => submitVote(i)}><span>{cand.name}</span></li>
          }): <p>No candidates found.</p>}
          </ul>: <p className="voted-for">{userData.hasVotedFor}</p>}
        </div>
      );
    }
  };


  return (
    <div className={"App"}>
      <NavigationBar web3={web3} account={account} connectToAccount={connectToAccount}/>
      {(isLoading) ? <h1 className="loading-message">Loading...</h1> : null}
      <div className={"main"}>
        {renderConnectionMessage()}
        {renderRegisterPanel()}
        {renderVotePanel()}
      </div>
    </div>
  );
}


export default App;

