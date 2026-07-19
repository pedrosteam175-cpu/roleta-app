'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import WheelCanvas from './WheelCanvas';
import AuthModal from './AuthModal';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import HistoryModal from './HistoryModal';
import AffiliateModal from './AffiliateModal';

interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  balance: number;
  bonusBalance?: number;
  affiliateCode: string;
}

  const [amount,setAmount] = useState('');

  const [paypalEmail,setPaypalEmail] = useState('');

  const [loading,setLoading] = useState(false);

  const [error,setError] = useState('');

  const [success,setSuccess] = useState(false);



  async function handleWithdraw(
    e:React.FormEvent
  ){

    e.preventDefault();


    const value = Number(amount);



    if(!value || value <= 0){

      setError(
        'Informe um valor válido'
      );

      return;

    }



    if(value > balance){

      setError(
        'Saldo insuficiente'
      );

      return;

    }



    if(
      !paypalEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)
    ){

      setError(
        'Informe um email PayPal válido'
      );

      return;

    }



    setError('');

    setLoading(true);



    try{


      const res = await fetch(
        '/api/withdraw',
        {

          method:'POST',

          headers:{
            'Content-Type':'application/json'
          },

          credentials:'include',

          body:JSON.stringify({

            amount:value,

            paypalEmail

          })

        }
      );



      const data = await res.json();



      if(!res.ok){

        setError(
          data.error ||
          'Erro ao processar saque'
        );

        return;

      }



      setSuccess(true);


      onSuccess(
        data.newBalance
      );



    }catch{


      setError(
        'Erro de conexão'
      );



    }finally{

      setLoading(false);

    }


  }





  return (

    <div
      className="modal-overlay"
      onClick={onClose}
    >


      <div

        className="modal-box"

        onClick={
          e=>e.stopPropagation()
        }

      >


        <div
          style={{
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center'
          }}
        >

          <h2>
            💸 Saque PayPal
          </h2>


          <button
            onClick={onClose}
            style={{
              background:'none',
              border:'none',
              fontSize:24,
              cursor:'pointer'
            }}
          >

            ✕

          </button>


        </div>




        {
          success ? (

            <div
              style={{
                textAlign:'center',
                padding:20
              }}
            >

              <h2>
                ✅ Solicitação enviada
              </h2>


              <p>
                O pagamento será enviado para seu PayPal.
              </p>



              <button

                className="btn-primary"

                onClick={onClose}

              >

                Fechar

              </button>


            </div>


          ) : (



          <form

            onSubmit={handleWithdraw}

            style={{
              display:'flex',
              flexDirection:'column',
              gap:15,
              marginTop:20
            }}

          >


            <div
              className="card"
            >

              <p>
                Saldo disponível
              </p>


              <h2>

                R$ {
                  balance.toLocaleString(
                    'pt-BR',
                    {
                      minimumFractionDigits:2
                    }
                  )
                }

              </h2>


            </div>





            <input

              className="input-field"

              type="number"

              step="0.01"

              min="0.01"

              max={balance}

              placeholder="Valor do saque"

              value={amount}

              onChange={
                e=>setAmount(e.target.value)
              }

              required

            />





            <input

              className="input-field"

              type="email"

              placeholder="Email da conta PayPal"

              value={paypalEmail}

              onChange={
                e=>setPaypalEmail(e.target.value)
              }

              required

            />





            {
              error && (

                <p
                  style={{
                    color:'red'
                  }}
                >

                  {error}

                </p>

              )
            }





            <button

              className="btn-primary"

              disabled={loading}

              type="submit"

            >

              {
                loading
                ?
                'Processando...'
                :
                'Solicitar Saque'
              }


            </button>



          </form>


          )

        }


      </div>


    </div>

  );

         }
