import * as React from 'react';
import { Typography, Grid } from '@mui/material';

export default function CollectionInfo({values}) {

  return (
    <Grid container spacing={2}>

      <Grid item xs={6}>
        <Typography variant="body2">
          Collection Status
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" align="right" color="primary">
          {values.saleStage}
        </Typography>
      </Grid>

      <Grid item xs={6}>
        <Typography variant="body2">
          Sale Status
        </Typography>
        </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" align="right" color="primary" >
          {values.isMintingPaused ? "Closed"
            : values.isWhitelistMintEnabled 
            ? values.isUserInWhitelist ? "Approved" : "Not Approved"
            : "Open"
          }
        </Typography>
      </Grid>

      <Grid item xs={6}>
        <Typography variant="body2" >
          Minting Status
        </Typography>
        </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" align="right" color="primary">
          {`${values.totalSupply} of ${values.maxSupply}`}
        </Typography>
      </Grid>

      <Grid item xs={6}>
        <Typography variant="body2" >
          She Blooms Owned
        </Typography>
        </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" align="right" color="primary">
          {values.nftWallet?.length ? '#' + values.nftWallet?.join(', #') : 'Your Wallet is Empty'}
        </Typography>
      </Grid>

    </Grid>
    );
}
