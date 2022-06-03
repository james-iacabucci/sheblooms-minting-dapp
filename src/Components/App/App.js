import * as React from 'react';
import { useEffect, useState } from 'react';

import { Container, Grid, Stack } from '@mui/material';
import { Card, CardMedia, CardContent, CardActions } from '@mui/material';
import { LinearProgress } from '@mui/material/';
import { Typography, Divider, Button, Chip, ButtonGroup, Box} from '@mui/material/';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { BigNumber } from 'ethers'
import { useMoralis, useNativeBalance, useChain } from "react-moralis";

import CollectionConfig from '../../Config/CollectionConfig';
import background from "../../assets/background4.png";
import logo from "../../assets/Logos/SB_Full_White_Padding.png";
import Header from './../Header/Header';
import CollectionInfo from './../Collection/CollectionInfo';
import './App.css';

import Freelist from './../SpecialLists/Freelist';
import Goldlist from './../SpecialLists/Goldlist';
const nftContractAbi = require('../../Config/SheBloomsCollection.json').abi;
//const stakingContractAbi = require('../../Config/SheBloomsStaking.json').abi;

const defaultState = {
  userAddress: null,
  userBalance: 0,
  ownerAddress: null,
  network: null,
  networkConfig: null, /// CollectionConfig.mainnet, 
  totalSupply: 0,
  maxSupply: 0,
  maxMintAmountPerTx: 0,
  tokenPrice: BigNumber.from(0),
  isMintingPaused: null,
  isFreelistMintEnabled: false,
  isGoldlistMintEnabled: false,
  isPreSaleMintEnabled: false,
  isUserInFreelist: false,
  isUserInGoldlist: false,
  nftWallet: [],
  //isStakingPaused: null,
  //stakingWallet: [],
  earnings: 0,
  saleStage: null,
  merkleProofManualAddress: '', 
  merkleProofManualAddressFeedbackMessage: null,
};

function App() {  

  const { chainId } = useChain();
  const { data } = useNativeBalance()
  const [ error, setError ] = useState('');
  const [ mintAmount, setMintAmount ] = useState(1);
  const [ values, setValues ] = useState(defaultState);
  const [ processing, setProcessing ] = useState(false);
  const [ transaction, setTransaction ] = useState(null);
  const [ transactionCompleted, setTransactionCompleted ] = useState(false);
  const [ contractFound, setContractFound ] = useState(false);
  const { authenticate, logout, isWeb3Enabled, enableWeb3, isAuthenticated, isWeb3EnableLoading, account, chain, Moralis } = useMoralis();

  let nftContractOptions = {
    contractAddress: CollectionConfig.contractAddress,
    abi: nftContractAbi,
    functionName: null,
    msgValue: 0
  }

  // let stakingContractOptions = {
  //   contractAddress: CollectionConfig.stakingAddress,
  //   abi: stakingContractAbi,
  //   functionName: null,
  //   msgValue: 0
  // }

  async function signIn(providerId) {
    await authenticate({ provider: providerId })
  }

  async function signOut() {
    await logout()
    setValues(() => defaultState)
  }

  // Retrieve Staking Rewards
  /*
  useEffect(() => {
    setInterval(async () => {
      try {
        const earnings = await Moralis.executeFunction({...stakingContractOptions, params: { tokenIds: values.stakingWallet }, functionName: 'earningInfo' });    
        setValues(prevValues => ({ ...prevValues, earnings: earnings }));   
      } catch(e) {
        console.log(e);
      }
    }, 60000);
  }, [values.stakingWallet]);
  */

  useEffect(() => {
    async function initialize () {
      if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) {
        await enableWeb3() 
      }
      if (isAuthenticated && isWeb3Enabled) {
        console.log('Moralis Library', Moralis ? Moralis.web3Library : null)
        await initWallet()
      }
    } 
    initialize()

    const unsubAccountChanged = Moralis.onAccountChanged(function(account) {
      console.log("Detected an Account Change:", account);
      window.location.reload();
    });

    const unsubChainChanged = Moralis.onChainChanged(function(chain) {
      console.log("Detected a Chain Change:", chain);
      window.location.reload();
    });

    return () => {
      unsubAccountChanged();
      unsubChainChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled, account, chain]);

  useEffect(() => {
    console.log('VALUES', values)
  }, [values])

async function initWallet() {

    setProcessing(true);

    setValues(() => defaultState);

    if (!account) {
      console.log('initWallet: account is null. exiting...')
      return;
    }
    
    let owner = null;
    let maxSupply = 0;
    let totalSupply = 0;
    let maxMintAmountPerTx = 0;
    let cost = 0;
    let isMintingPaused = true;
    let isFreelistMintEnabled = false;
    let isGoldlistMintEnabled = false;
    let isPreSaleMintEnabled = false;
    let nftWallet = null;

    // COLLECTION PROPERTIES
    try {
      owner = await Moralis.executeFunction({...nftContractOptions,  functionName: 'owner' });
      maxSupply = (await Moralis.executeFunction({...nftContractOptions,  functionName: 'maxSupply' }))?.toNumber();
      totalSupply = (await Moralis.executeFunction({...nftContractOptions,  functionName: 'totalSupply' }))?.toNumber();
      maxMintAmountPerTx = (await Moralis.executeFunction({...nftContractOptions,  functionName: 'maxMintAmountPerTx' }))?.toNumber();
      cost = await Moralis.executeFunction({...nftContractOptions,  functionName: 'cost' });
      isMintingPaused = await Moralis.executeFunction({...nftContractOptions,  functionName: 'paused' });
      isFreelistMintEnabled = await Moralis.executeFunction({...nftContractOptions,  functionName: 'freeListMintEnabled' });
      isGoldlistMintEnabled = await Moralis.executeFunction({...nftContractOptions,  functionName: 'goldListMintEnabled' });
      isPreSaleMintEnabled = await Moralis.executeFunction({...nftContractOptions,  functionName: 'preSaleMintEnabled' });
      nftWallet = await Moralis.executeFunction({...nftContractOptions, params: { _owner: account }, functionName: 'walletOfOwner' });
    } 
    catch(e) {
      console.error(e)
      setContractFound(false);
      setProcessing(false); 
      return
    }
    
    // STAKING PROPERTIES
    //const stakingWallet = await Moralis.executeFunction({...stakingContractOptions, params: { account: account }, functionName: 'tokensOfOwner' });
    //const isStakingPaused = await Moralis.executeFunction({...stakingContractOptions, functionName: 'paused' });

    setValues(prevValues => ({
      ...prevValues,
      userAddress: account.toUpperCase(),
      ownerAddress: owner.toUpperCase(),
      userBalance: data?.balance,
      maxSupply: maxSupply,
      totalSupply: totalSupply,
      maxMintAmountPerTx: maxMintAmountPerTx,
      tokenPrice: cost,
      isMintingPaused: isMintingPaused,
      saleStage: isFreelistMintEnabled ? "Free List Only" : isGoldlistMintEnabled ? "Gold List Only" : isPreSaleMintEnabled ? "Pre Sale" : "Public Sale",
      isFreelistMintEnabled: isFreelistMintEnabled,
      isGoldlistMintEnabled: isGoldlistMintEnabled,
      isPreSaleMintEnabled: isPreSaleMintEnabled,
      isUserInFreelist: Freelist.contains(account ?? ''),
      isUserInGoldlist: Goldlist.contains(account ?? ''),
      nftWallet: nftWallet,
      //isStakingPaused: isStakingPaused,
      //stakingWallet: stakingWallet,
    }));

    setContractFound(true);
    setProcessing(false); 
  }

  // COLLECTION FUNCTIONS

  async function mintTokens(amount) {
    try {
      let tx;
      values.isFreelistMintEnabled
        ? tx = await Moralis.executeFunction({...nftContractOptions, params: { _mintAmount: amount, _merkleProof: Freelist.getProofForAddress(account) }, msgValue: values.tokenPrice.mul(amount), functionName: 'freeListMint' })
        : values.isGoldlistMintEnabled
          ? tx = await Moralis.executeFunction({...nftContractOptions, params: { _mintAmount: amount, _merkleProof: Goldlist.getProofForAddress(account) }, msgValue: values.tokenPrice.mul(amount), functionName: 'goldListMint' })
          : tx = await Moralis.executeFunction({...nftContractOptions, params: { _mintAmount: amount }, msgValue: values.tokenPrice.mul(amount), functionName: 'mint' }); 
      setTransaction(tx.hash);
      setTransactionCompleted(false)
      setProcessing(true);
      await tx.wait();
      setProcessing(false);
      setTransactionCompleted(true);
    } 
    catch (e) {
      console.error(e)
      setError(e);
      setProcessing(false);
    }
  }

  /*
  async function whitelistMintTokens(amount) {
    try {
      //const tx = await this.contract.whitelistMint(amount, Whitelist.getProofForAddress(this.state.userAddress!), {value: this.state.tokenPrice.mul(amount)});
      const tx = await Moralis.executeFunction({...nftContractOptions, params: { _mintAmount: amount, _merkleProof: Whitelist.getProofForAddress(account) }, msgValue: values.tokenPrice.mul(amount), functionName: 'whitelistMint' }); 
      setTransaction(tx.hash);
      setTransactionCompleted(false)
      setProcessing(true);
      await tx.wait();
      setProcessing(false);
      setTransactionCompleted(true);
    } catch (e) {
      setError(e);
      setProcessing(false);
    }
  }
  */

  function incrementMintAmount() {
    setMintAmount(Math.min(values.maxMintAmountPerTx, mintAmount + 1));
  }

  function decrementMintAmount() {
    setMintAmount(Math.max(1, mintAmount - 1));
  }

  function acknowledgeError() {
    setError(null);
  }
  async function acknowledgeTransaction() {
    setTransaction(null);
    setTransactionCompleted(false);
    await initWallet();
  }

  function getErrorText() {
    if (error.message.includes('Your address has already claimed')) {
      return `Your wallet address has already claimed and minted its ${values.saleStage} NFT`
    }
    if (error.message.includes('This is an invalid')) {
      return "Your wallet address is not approved for Gold List minting."
    }
    if (error.message.includes('maximum supply')) {
      return "There are not enough NFTs left to complete your purchase."
    }

    switch(error.code) {
      case "INSUFFICIENT_FUNDS": return "Your wallet does not have enough ETH to complete this purchase."
      case 4001: return "This transaction has been canceled at your request."
      case 32603: return error.message
      default: return `An error has occurred while processing your transaction (${error.code})`
    }
  }

  //const isNothingStaked = values.stakingWallet?.length === 0;
  //const isNothingOwned = values.nftWallet?.length === 0;
  const mintCost = Moralis.Units.FromWei(values.tokenPrice, 18) * mintAmount;
  const isWalletConnected = () => (account !== null) && isAuthenticated;
  const isSoldOut = () => values.maxSupply !== 0 && values.totalSupply >= values.maxSupply;
  const isMainNet = () => chainId === "0x1";
  const isTestNet = () => chainId === "0x4"; 
  const isPurchaseEnabled = () => isWalletConnected() && !isSoldOut() && !values.isMintingPaused && contractFound;

  function MessageCard(props) {
    return (
      <Card sx={{
        position: "relative",
        display: "flex",
        padding: '1em',
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: props.backgroundColor ? props.backgroundColor : "black",
        alignItems: "center"}}
      >
        {props.children}
      </Card>        
    )
  };

  function openInNewTab(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Container disableGutters maxWidth="false" >
      <Header 
        values={values}
        data={data}
        signOut={signOut} 
        setError={setError}
        processing={processing}
        setProcessing={setProcessing}
        //stakingContractOptions={stakingContractOptions}
        nftContractOptions={nftContractOptions}
      />
      <div style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: `url(${background})`
        }}
      >
      <Container fixed={true} maxWidth="xs">
        <Stack spacing={2}> 
          
          <Card raised={true}>

            <CardMedia component="img" image={logo} alt="She Blooms" sx={{backgroundColor: "black" }}/>

            {!processing && !isWalletConnected() && 
              <>
                <CardContent mt={2}>
                  <Typography variant="body2" align='center'>Please connect your Ethereum wallet to continue.</Typography> 
                </CardContent>
                <CardActions>
                  <Button fullWidth sx={{ color: 'white'}} variant='contained' onClick={() => signIn("metamask")}>Metamask</Button>
                  <Button fullWidth sx={{ color: 'white'}} variant='contained' onClick={() => signIn("walletconnect")}>WalletConnect</Button>
                </CardActions>
              </>
            }

            {!processing && isWalletConnected() && !contractFound &&
              <CardContent mt={2}>
                <Stack spacing={2}>
                  <Typography variant="body2" textAlign={'center'} >Something went wrong!</Typography>
                  <Typography variant="body2" textAlign={'center'} >The She Blooms smart contract could not be found.</Typography>
                  <Typography variant="body2" textAlign={'center'} >Please make sure your wallet is connected to the Ethereum MainNet.</Typography>
                </Stack>
              </CardContent>
            }

            {!processing && error && 
              <>
                <CardContent mt={2}>
                  <Stack spacing={2}>
                    <Typography variant="h5" color='primary' fontWeight='bold' align='center'>Something Went Wrong!</Typography> 
                    <Typography variant="body2" align='center'>{getErrorText()}</Typography> 
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button fullWidth sx={{ color: 'white'}} variant='contained' onClick={() => acknowledgeError()}>OK</Button>
                </CardActions>
              </>
            }

            {processing && !transaction && 
              <CardContent mt={2}>
                <Stack spacing={2}>
                  <Typography variant="body2" textAlign={'center'} >Loading She Blooms Collection...</Typography>  
                  <Box sx={{ width: '100%' }}><LinearProgress /></Box>
                </Stack>
              </CardContent>
            }

            {processing && transaction && !transactionCompleted &&
              <CardContent mt={2}>
                <Stack spacing={2}>
                  <Typography variant="h5" color='primary' fontWeight='bold' align='center' >Processing Your Transaction</Typography>
                  <Typography variant="body2" textAlign={'center'} >Your transaction has been submitted to the Ethereum Network and is waiting to be confirmed!</Typography>
                  <Typography variant="body2" textAlign={'center'} >Your screen will automatically be refreshed when the transaction is completed. This may take up to 5 minutes to complete, so please be patient.</Typography>
                  <Chip sx={{ fontSize: 9 }} label={transaction}/>
                  <Button variant="contained" sx={{ color: 'white'}} fullWidth size="small" onClick={() => openInNewTab(`https://${isTestNet() ? "rinkeby." : ""}etherscan.io/tx/${transaction}`)}>View your transaction on EtherScan</Button>
                  <Box mt={2} sx={{ width: '100%' }}><LinearProgress /></Box>
                </Stack>
              </CardContent>
            }

            {!processing && transactionCompleted && 
              <CardContent mt={2}>
                <Stack spacing={2}>
                  <Typography variant="h5" color='primary' fontWeight='bold' align='center' >Congratulations!</Typography>
                  <Typography variant="body2" textAlign={'center'} >You transaction has been confirmed!</Typography>
                  <Chip variant="outlined" sx={{ fontSize: 9 }} label={transaction}/>
                  <Button variant="outlined" fullWidth size="small" onClick={() => openInNewTab(`https://${isTestNet() ? "rinkeby." : ""}etherscan.io/tx/${transaction}`)}>View your transaction on EtherScan</Button>
                  <Button fullWidth sx={{ color: 'white'}} variant='contained' onClick={() => acknowledgeTransaction()}>OK</Button>
                </Stack>
              </CardContent>
            }            

            {/* COLLECTION INFORMATION */}
            {!processing && isWalletConnected() && contractFound && !error && !transactionCompleted &&
              <CardContent mt={2}>
                <CollectionInfo values={values}/>
              </CardContent>
            }
            
            <Divider />

            {/* MINTING CONTROLS */}
            {!processing && isPurchaseEnabled() && !error && !transactionCompleted && 
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={4} >
                    <ButtonGroup variant="contained">
                      <Button variant="contained" sx={{ color: 'white'}} fullWidth onClick={() => decrementMintAmount()}>-</Button>
                      <Button variant="contained" sx={{ color: 'white'}} fullWidth>{`${mintAmount}`}</Button>
                      <Button variant="contained" sx={{ color: 'white'}} fullWidth onClick={() => incrementMintAmount()}>+</Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item xs={4} >
                    <Typography mt={0.5} variant="body2" align='center' fontSize={"1rem"} fontWeight={'bold'} color="primary">
                      {`${mintCost} ETH`}
                    </Typography>
                    <Typography mt={-0.5} align='center' fontSize={10}>
                      (plus gas)
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Button fullWidth variant='contained' sx={{ color: 'white'}} disabled={values.isMintingPaused} onClick={() => mintTokens(mintAmount)} endIcon={<ArrowForwardIcon />}>Mint</Button>
                  </Grid>
                </Grid>
              </CardContent>
            }

          </Card>

          {/* ADDITIONAL INFO/ALERT CARDS FOR VARIOUS CONDITIONS */}
          
          {!processing && values.isMintingPaused && contractFound &&
            <MessageCard>
              <Typography variant="body2" color='primary' align='center'>This sale is closed. Please come back for our next sale!</Typography>
            </MessageCard>   
          }       

          {!processing && isSoldOut() && contractFound &&
            <MessageCard>
              <Typography variant="body2" color='primary' align='center'>Thank you for your support!</Typography>
              <Typography variant="body2" color='primary' align='center'>Our current sale is sold out, but please come back for our next sale!</Typography>
            </MessageCard>
          }   

          {!processing && !isMainNet() && 
            <MessageCard>
              <Typography variant="body2" color='orange' align='center'>You are not connected to the Ethereum MainNet.</Typography>
              <Typography variant="body2" color='orange' align='center'>Please connect to continue...</Typography>
            </MessageCard>
          }       
 
        </Stack>
      </Container>
    </div>
  </Container>

  );
}

export default App;


