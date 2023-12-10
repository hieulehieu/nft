import { useState, useEffect } from 'react';
import { HiSwitchVertical } from 'react-icons/hi';
import { InlineIcon } from '@iconify/react';
import { useSelector } from 'react-redux';
import ReactLoading from 'react-loading';
import toast from 'react-hot-toast';
import { formatNumber, getNativeBalance, parseMetamaskError, mintERC20, burnERC20 } from '@src/utils';
import { wBNB_ADDRESS } from '@src/constants';
import bnbTokenIcon from '@src/assets/bnb-token.svg';
import { ethers } from 'ethers';
import styles from '../styles.module.scss';

export default function Swap() {
  const account = useSelector((state) => state.account);

  const [isLoading, setIsLoading] = useState(true);

  const [fromToken, setFromToken] = useState({
    img: bnbTokenIcon,
    symbol: 'BNB',
    address: wBNB_ADDRESS,
    balance: 0,
  });

  const [toToken, setToToken] = useState({
    img: bnbTokenIcon,
    symbol: 'wBNB',
    address: ethers.constants.AddressZero,
    balance: account.balance,
  });

  const [inputData, setInputData] = useState({
    pay: 1,
    rate: 1,
    receive: 1,
  });

  const handleChange = (e) => {
    const newInputData = { ...inputData, [e.target.name]: e.target.value };
    if (e.target.name === 'pay' || e.target.name === 'rate') {
      newInputData.receive = formatNumber(newInputData.pay * newInputData.rate, 18);
    } else if (e.target.name === 'receive') {
      newInputData.rate = formatNumber(newInputData.receive / newInputData.pay, 18);
    }

    setInputData(newInputData);
  };

  const handleSwitchToken = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      if (fromToken.symbol === 'BNB') {
        const tx = await mintERC20(inputData.pay);
        await tx.wait();
      } else {
        const tx = await burnERC20(inputData.pay);
        await tx.wait();
      }

      setFromToken({
        ...fromToken,
        balance: (fromToken.balance - inputData.pay).toFixed(2),
      });

      setToToken({
        ...toToken,
        balance: (Number(toToken.balance) + Number(inputData.pay)).toFixed(2),
      });
      toast.success('Swap successfully');
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      const txError = parseMetamaskError(error);
      setIsLoading(false);
      toast.error(txError.context);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    getNativeBalance(account.address)
      .then((BNB) => {
        if (fromToken.symbol === 'BNB') {
          setFromToken({ ...fromToken, balance: BNB });
          setToToken({ ...toToken, balance: account.balance });
        } else {
          setToToken({ ...toToken, balance: BNB });
          setFromToken({ ...fromToken, balance: account.balance });
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.log('init', err);
        setIsLoading(false);
      });
  }, [account]);

  return (
    <div className={styles['swap-container']}>
      {isLoading && (
        <div className={styles.loading}>
          <ReactLoading type="spinningBubbles" color="#ffffff" height={60} width={60} />
        </div>
      )}
      <div className={styles.title}>Swap</div>
      <div className={styles.inputControl}>
        <div className={styles.label}>
          <span>Pay</span>
          <span className={styles['from-balance']}>
            <InlineIcon icon="mdi:wallet-outline" fontSize={12} color="rgba(235, 235, 245, 0.5)" />
            <div>
              {fromToken.balance} {fromToken.symbol}
            </div>
          </span>
        </div>
        <div className={styles.inputWrap}>
          <input type="number" value={inputData.pay} name="pay" onChange={handleChange} required />
          <div className={styles.tokenWrap}>
            <img src={fromToken.img} />
            <span>{fromToken.symbol}</span>
          </div>
        </div>
      </div>
      <div className={styles.switchToken}>
        <HiSwitchVertical size={24} color="#fff" cursor="pointer" onClick={handleSwitchToken} />
      </div>
      <div className={styles.inputControl}>
        <div className={styles.label}>
          <span>Receive</span>
          <span className={styles['from-balance']}>
            <InlineIcon icon="mdi:wallet-outline" fontSize={12} color="rgba(235, 235, 245, 0.5)" />
            <div>
              {toToken.balance} {toToken.symbol}
            </div>
          </span>
        </div>
        <div className={styles.inputWrap}>
          <input type="number" value={inputData.receive} name="receive" onChange={handleChange} required />
          <div className={styles.tokenWrap}>
            <img src={toToken.img} />
            <span>{toToken.symbol}</span>
          </div>
        </div>
      </div>
      <button type="button" className={styles.submitBtn} onClick={handleSubmit}>
        Swap
      </button>
    </div>
  );
}
