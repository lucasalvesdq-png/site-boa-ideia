<?php
/* api/config.example.php — modelo de configuração do painel /admin.

   Copie este arquivo como api/config.php e preencha os dois valores. O
   api/config.php real NUNCA vai para o repositório (está no .gitignore):
   ele existe apenas na sua máquina e dentro do public_html da HostGator.

   Para gerar os dois valores de uma vez:
     node scripts/gerar-credenciais-php.mjs "nome.usuario" "a-senha-escolhida" */
return [
    /* Chave que assina o cookie de sessão. Qualquer string aleatória longa
       (>= 32 caracteres). Trocar este valor derruba todas as sessões abertas. */
    'SESSION_SECRET' => 'troque-por-uma-string-aleatoria-longa',

    /* Pessoas com acesso ao painel. A senha nunca aparece aqui — só o hash
       PBKDF2-SHA256 e o salt gerados pelo script acima. */
    'ADMIN_USERS' => [
        [
            'username' => 'escola',
            'salt' => '',
            'hash' => '',
            'iter' => 210000,
        ],
    ],
];
