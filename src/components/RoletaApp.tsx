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

const MAIN_COUNT = 9;
const BONUS_COUNT = 4;

const MAIN_VALUES = [1, 2, 3, 5, 10, 20, 50, 100, 0.5];
const BONUS_VALUES = [1, 2, 3, 4];

function valueToAngle(
  value: number,
  values: number[],
  total: number
) {
  const index = values.indexOf(value);

  if (index === -1) return 0;

  return index * ((Math.PI * 2) / total);
}

export default function RoletaApp() {

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [modal, setModal] = useState<
    null |
    'auth' |
    'deposit' |
    'withdraw' |
    'history' |
    'affiliate' |
    'win'
  >(null);

  const [betAmount, setBetAmount] = useState(0.5);
  const [spinning, setSpinning] = useState(false);
  const [flash, setFlash] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);


  // ROLETAS

  const [mainRotation, setMainRotation] = useState(0);
  const [bonusRotation, setBonusRotation] = useState(0);

  const mainRotRef = useRef(0);
  const bonusRotRef = useRef(0);

  const animRef = useRef<number | null>(null);


  // RESULTADO

  const [winData, setWinData] = useState<any>(null);

  const [floatingWin, setFloatingWin] =
    useState<{key:number; amount:number} | null>(null);


  // TAMANHO

  const [wheelSize, setWheelSize] = useState(220);
  const [bonusWheelSize, setBonusWheelSize] = useState(140);



  // RESPONSIVO (CORRIGIDO)

  useEffect(() => {

    function updateSizes(){

      const width = window.innerWidth;

      if(width < 400){

        setWheelSize(160);
        setBonusWheelSize(100);

      } else if(width < 600){

        setWheelSize(200);
        setBonusWheelSize(125);

      } else {

        setWheelSize(240);
        setBonusWheelSize(150);

      }

    }


    updateSizes();

    window.addEventListener(
      'resize',
      updateSizes
    );


    return () => {

      window.removeEventListener(
        'resize',
        updateSizes
      );

    };


  }, []);



  // BUSCAR USUÁRIO

  useEffect(() => {

    fetch('/api/auth/me',{
      credentials:'include'
    })
    .then(r =>
      r.ok ? r.json() : null
    )
    .then(data => {

      if(data?.user){

        setUser(data.user);

      }

    })
    .finally(()=>{

      setAuthLoading(false);

    });


  },[]);



  // GIRO

  const spinWheels = useCallback(async()=>{

    if(spinning || !user)
      return;


    if(user.balance < betAmount){

      alert('Saldo insuficiente');
      return;

    }


    setSpinning(true);
    setWinData(null);



    let startTime:number | null = null;

    const duration = flash ? 3000 : 5000;



    function animate(time:number){

      if(!startTime)
        startTime = time;


      const progress =
        Math.min(
          (time - startTime) / duration,
          1
        );


      const ease =
        1 - Math.pow(1-progress,3);



      mainRotRef.current +=
        0.25 * (1 - ease * .85);


      bonusRotRef.current +=
        0.18 * (1 - ease * .85);



      setMainRotation(mainRotRef.current);
      setBonusRotation(bonusRotRef.current);



      if(progress < .7){

        animRef.current =
          requestAnimationFrame(animate);

        return;

      }



      fetch('/api/spin',{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        credentials:'include',
        body:JSON.stringify({
          betAmount
        })
      })
      .then(r=>r.json())
      .then(data=>{

        if(data.error){

          alert(data.error);
          setSpinning(false);
          return;

        }


        const mainTarget =
          valueToAngle(
            data.mainResult,
            MAIN_VALUES,
            MAIN_COUNT
          );


        const bonusTarget =
          valueToAngle(
            data.bonusResult,
            BONUS_VALUES,
            BONUS_COUNT
          );



        const extra =
          Math.PI * 4;


        const finalMain =
          Math.ceil(mainRotRef.current/(Math.PI*2))
          *(Math.PI*2)
          + extra
          + mainTarget;


        const finalBonus =
          Math.ceil(bonusRotRef.current/(Math.PI*2))
          *(Math.PI*2)
          + extra
          + bonusTarget;



        const start =
          performance.now();


        const startMain =
          mainRotRef.current;


        const startBonus =
          bonusRotRef.current;



        function stopAnimation(ts:number){

          const p =
            Math.min(
              (ts-start)/1200,
              1
            );


          const e =
            1-Math.pow(1-p,4);



          const m =
            startMain +
            (finalMain-startMain)*e;


          const b =
            startBonus +
            (finalBonus-startBonus)*e;



          mainRotRef.current=m;
          bonusRotRef.current=b;


          setMainRotation(m);
          setBonusRotation(b);



          if(p<1){

            animRef.current =
              requestAnimationFrame(stopAnimation);

          }else{

            setUser(prev =>
              prev
              ? {
                  ...prev,
                  balance:data.newBalance
                }
              : prev
            );


            setWinData(data);

            setFloatingWin({
              key:Date.now(),
              amount:data.winAmount
            });


            setModal('win');

            setSpinning(false);


            setTimeout(()=>{
              setFloatingWin(null);
            },2000);

          }

        }


        animRef.current =
          requestAnimationFrame(stopAnimation);


      })
      .catch(()=>{

        setSpinning(false);
        alert('Erro ao girar');

      });


    }


    animRef.current =
      requestAnimationFrame(animate);


  },[
    spinning,
    user,
    betAmount,
    flash
  ]);



  function handleLogout(){

    fetch('/api/auth/me',{
      method:'DELETE',
      credentials:'include'
    })
    .then(()=>{
      setUser(null);
    });

  }



  const BET_STEPS =
    [0.5,1,2,5,10,20,50,100];


  function changeBet(dir:1|-1){

    const index =
      BET_STEPS.indexOf(betAmount);


    const next =
      index + dir;


    if(next>=0 && next<BET_STEPS.length){

      setBetAmount(
        BET_STEPS[next]
      );

    }

  }



  const menuItems = user ? [

    {
      label:'💰 Depositar',
      action:()=>setModal('deposit')
    },

    {
      label:'💸 Sacar',
      action:()=>setModal('withdraw')
    },

    {
      label:'📜 Histórico',
      action:()=>setModal('history')
    },

    {
      label:'🤝 Afiliado',
      action:()=>setModal('affiliate')
    },

    {
      label:'🚪 Sair',
      action:handleLogout
    }


  ] : [];
    return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      {/* HEADER */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >

        <div
          style={{
            display:'flex',
            alignItems:'center',
            gap:10
          }}
        >

          <span style={{fontSize:28}}>
            🎰
          </span>


          <div>

            <h1
              style={{
                fontSize:18,
                fontWeight:900,
                background:
                  'linear-gradient(90deg,#ffd700,#00ff88)',
                WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent'
              }}
            >
              Roleta da Sorte
            </h1>


            <p
              style={{
                fontSize:11,
                color:'var(--text-muted)'
              }}
            >
              Gire e Ganhe Sempre!
            </p>


          </div>

        </div>



        <div
          style={{
            display:'flex',
            alignItems:'center',
            gap:10
          }}
        >


        {
          user && (

          <>

            <div
              style={{
                background:'rgba(0,255,136,.1)',
                border:'1px solid rgba(0,255,136,.3)',
                borderRadius:10,
                padding:'6px 14px',
                textAlign:'right'
              }}
            >

              <p
                style={{
                  fontSize:11,
                  color:'var(--text-muted)'
                }}
              >
                Saldo
              </p>


              <p
                style={{
                  fontSize:16,
                  fontWeight:800,
                  color:'var(--accent-green)'
                }}
              >

                R$ {
                  user.balance.toLocaleString(
                    'pt-BR',
                    {
                      minimumFractionDigits:2
                    }
                  )
                }

              </p>


            </div>



            <div
              style={{
                position:'relative'
              }}
            >

              <button
                onClick={()=>
                  setMenuOpen(v=>!v)
                }
                style={{
                  background:'var(--bg-card2)',
                  border:'1px solid var(--border)',
                  borderRadius:10,
                  padding:'8px 12px',
                  cursor:'pointer',
                  fontSize:20
                }}
              >
                👤
              </button>



              {
                menuOpen && (

                <div
                  style={{
                    position:'absolute',
                    right:0,
                    top:'110%',
                    background:'var(--bg-card)',
                    border:'1px solid var(--border)',
                    borderRadius:12,
                    minWidth:190,
                    zIndex:100,
                    overflow:'hidden'
                  }}
                >

                  <div
                    style={{
                      padding:'12px 16px',
                      borderBottom:
                        '1px solid var(--border)'
                    }}
                  >

                    <p style={{fontWeight:700}}>
                      {user.name}
                    </p>


                    <p
                      style={{
                        fontSize:12,
                        color:'var(--text-muted)'
                      }}
                    >
                      {user.email}
                    </p>

                  </div>



                  {
                    menuItems.map(item=>(

                    <button
                      key={item.label}
                      onClick={()=>{
                        item.action();
                        setMenuOpen(false);
                      }}
                      style={{
                        width:'100%',
                        padding:'12px 16px',
                        background:'none',
                        border:'none',
                        color:'var(--text-primary)',
                        cursor:'pointer',
                        textAlign:'left'
                      }}
                    >
                      {item.label}
                    </button>

                    ))
                  }


                </div>

                )
              }


            </div>


          </>

          )
        }


        </div>


      </header>





      {/* CONTEÚDO */}

      <main
        style={{
          flex:1,
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          padding:'20px 16px',
          gap:20
        }}
      >



        {/* ROLETA */}

        <div
          style={{
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            gap:12
          }}
        >


          <div
            style={{
              position:'relative',
              display:'flex',
              flexDirection:'column',
              alignItems:'center'
            }}
          >

            <div
              style={{
                width:0,
                height:0,
                borderLeft:'12px solid transparent',
                borderRight:'12px solid transparent',
                borderTop:'24px solid #ffd700'
              }}
            />


            <WheelCanvas
              type="main"
              rotation={mainRotation}
              size={wheelSize}
            />


            <p>
              Roleta Principal
            </p>


          </div>





          <div
            style={{
              display:'flex',
              flexDirection:'column',
              alignItems:'center'
            }}
          >

            <div
              style={{
                width:0,
                height:0,
                borderLeft:'8px solid transparent',
                borderRight:'8px solid transparent',
                borderTop:'16px solid #00ff88'
              }}
            />


            <WheelCanvas
              type="bonus"
              rotation={bonusRotation}
              size={bonusWheelSize}
            />


            <p>
              Multiplicador Bônus
            </p>


          </div>



        </div>





        {
          floatingWin && (

          <div
            key={floatingWin.key}
            style={{
              position:'fixed',
              top:'40%',
              left:'50%',
              transform:'translateX(-50%)',
              fontSize:28,
              fontWeight:900,
              zIndex:200
            }}
          >

            +R$ {floatingWin.amount.toFixed(2)}

          </div>

          )
        }



        {/* CONTROLES */}

        <div
          className="card"
          style={{
            width:'100%',
            maxWidth:400,
            padding:24
          }}
        >

          <p>
            Valor do Giro:
            <b>
              R$ {betAmount.toFixed(2)}
            </b>
          </p>


          <div
            style={{
              display:'flex',
              justifyContent:'center',
              gap:15,
              marginTop:15
            }}
          >

            <button
              onClick={()=>changeBet(-1)}
            >
              −
            </button>


            <button
              onClick={()=>changeBet(1)}
            >
              +
            </button>

          </div>



          <button
            onClick={()=>setFlash(v=>!v)}
            style={{
              marginTop:15
            }}
          >
            ⚡ Modo Flash:
            {flash ? ' ON':' OFF'}
          </button>



          <button
            className="btn-spin"
            style={{
              width:'100%',
              marginTop:20
            }}
            disabled={spinning}
            onClick={()=>
              user
              ? spinWheels()
              : setModal('auth')
            }
          >

            {
              spinning
              ? '⏳ Girando...'
              : user
              ? '🎰 GIRAR'
              : '🎰 ENTRAR'
            }

          </button>


        </div>
                {/* INFORMAÇÕES */}

        <div
          className="card"
          style={{
            width:'100%',
            maxWidth:400,
            padding:16
          }}
        >

          <h3
            style={{
              color:'var(--accent-gold)'
            }}
          >
            💎 Como Funciona
          </h3>


          <p>
            🎰 Roleta Principal: 0.5x até 100x
          </p>

          <p>
            ✨ Bônus: 1x, 2x, 3x ou 4x
          </p>

          <p>
            💰 Prêmio = aposta × multiplicador
          </p>

          <p>
            💳 PIX disponível para depósito e saque
          </p>

        </div>


      </main>




      {/* MODAIS */}


      {
        modal === 'auth' && (

          <AuthModal
            onClose={()=>
              setModal(null)
            }

            onSuccess={(u)=>{
              setUser(u);
              setModal(null);
            }}

            referralCode={
              typeof window !== 'undefined'
              ? new URLSearchParams(
                  window.location.search
                ).get('ref') ?? ''
              : ''
            }

          />

        )
      }




      {
        modal === 'deposit' && user && (

          <DepositModal
            onClose={()=>
              setModal(null)
            }

            onSuccess={(balance)=>{

              setUser(prev=>
                prev
                ? {
                    ...prev,
                    balance
                  }
                : prev
              );

              setModal(null);

            }}

          />

        )
      }





      {
        modal === 'withdraw' && user && (

          <WithdrawModal

            balance={user.balance}

            cpf={user.cpf ?? ''}

            name={user.name}

            onClose={()=>
              setModal(null)
            }


            onSuccess={(newBalance)=>{

              setUser(prev=>
                prev
                ? {
                    ...prev,
                    balance:newBalance
                  }
                : prev
              );

              setModal(null);

            }}

          />

        )
      }





      {
        modal === 'history' && (

          <HistoryModal
            onClose={()=>
              setModal(null)
            }
          />

        )
      }





      {
        modal === 'affiliate' && (

          <AffiliateModal
            onClose={()=>
              setModal(null)
            }
          />

        )
      }





      {
        modal === 'win' && winData && (

          <div
            style={{
              position:'fixed',
              inset:0,
              background:'rgba(0,0,0,.6)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              zIndex:300
            }}
          >

            <div
              className="card"
              style={{
                padding:30,
                textAlign:'center'
              }}
            >

              <h2>
                🎉 Você ganhou!
              </h2>


              <p>
                Multiplicador:
                <b>
                  {winData.totalMultiplier}x
                </b>
              </p>


              <h1
                style={{
                  color:'var(--accent-green)'
                }}
              >
                R$ {winData.winAmount.toFixed(2)}
              </h1>


              <button
                onClick={()=>
                  setModal(null)
                }
              >
                Fechar
              </button>


            </div>


          </div>

        )
      }




    </div>
  );

}
