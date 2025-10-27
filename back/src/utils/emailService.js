import nodemailer from 'nodemailer'

// Configuration du transporteur email
const createTransporter = () => {
  // Vérifier si les variables d'environnement SMTP sont configurées
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('⚠️ Variables SMTP non configurées. Les emails ne seront pas envoyés réellement.')
    console.warn('Configurez SMTP_HOST, SMTP_PORT, SMTP_USER et SMTP_PASS dans votre fichier .env')
    return null // Retourner null pour indiquer qu'aucun transporteur n'est disponible
  }

  // Pour le développement, on peut utiliser un service comme Gmail, Outlook, etc.
  // Pour la production, il faudrait utiliser un service dédié comme SendGrid, Mailgun, etc.

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort == 465, // true pour 465 (SSL), false pour 587 (STARTTLS)
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false // Accepter les certificats auto-signés ou non vérifiés
    }
  })

  return transporter
}

// Fonction pour envoyer un email de vérification
export const sendVerificationEmail = async (email, verificationCode, username, emailType = 'registration') => {
  try {
    const transporter = createTransporter()

    // Si pas de transporteur configuré, simuler l'envoi pour le développement
    if (!transporter) {
      console.log(`📧 [SIMULATION] Email de vérification pour ${username} (${email})`)
      console.log(`📧 Code de vérification: ${verificationCode}`)
      console.log(`📧 Type: ${emailType}`)
      console.log(`📧 (Configurez les variables SMTP pour envoyer des vrais emails)`)
      return true
    }

    // Vérifier la connexion SMTP
    try {
      await transporter.verify()
      console.log('✅ Connexion SMTP vérifiée avec succès')
    } catch (verifyError) {
      console.error('❌ Erreur de connexion SMTP:', verifyError.message)
      return false
    }

    let subject, htmlContent

    if (emailType === 'delete-account') {
      subject = 'Confirmation de suppression de compte Chicken Haven'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #7a3e10; text-align: center; margin-bottom: 30px;">🐔 Chicken Haven</h1>

            <h2 style="color: #dc3545; margin-bottom: 20px;">⚠️ Confirmation de suppression de compte</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Bonjour ${username},
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Vous avez demandé la suppression définitive de votre compte Chicken Haven.
              Cette action est <strong>irréversible</strong> et entraînera la perte de toutes vos données.
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Pour confirmer la suppression de votre compte, utilisez le code ci-dessous :
            </p>

            <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${verificationCode}</h3>
            </div>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Ce code expirera dans <strong>15 minutes</strong>. Si vous n'avez pas demandé cette suppression,
              ignorez cet email et votre compte restera intact.
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Cordialement,<br>
              L'équipe Chicken Haven 🐔
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              Cet email a été écrit par des poules depuis leur poulailler. Ne pas répondre.
            </p>
          </div>
        </div>
      `
    } else if (emailType === 'password-change') {
      subject = 'Confirmation de changement de mot de passe Chicken Haven'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #7a3e10; text-align: center; margin-bottom: 30px;">🐔 Chicken Haven</h1>

            <h2 style="color: #007bff; margin-bottom: 20px;">🔑 Confirmation de changement de mot de passe</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Bonjour ${username},
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Vous avez demandé à changer votre mot de passe Chicken Haven.
              Pour confirmer ce changement, utilisez le code ci-dessous :
            </p>

            <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${verificationCode}</h3>
            </div>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Ce code expirera dans <strong>15 minutes</strong>. Si vous n'avez pas demandé ce changement,
              ignorez cet email et votre mot de passe restera inchangé.
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Cordialement,<br>
              L'équipe Chicken Haven 🐔
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              Cet email a été écrit par des poules depuis leur poulailler. Ne pas répondre.
            </p>
          </div>
        </div>
      `
    } else if (emailType === 'password-reset') {
      subject = 'Réinitialisation de votre mot de passe Chicken Haven'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #7a3e10; text-align: center; margin-bottom: 30px;">🐔 Chicken Haven</h1>

            <h2 style="color: #dc3545; margin-bottom: 20px;">🔒 Réinitialisation de mot de passe</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Bonjour ${username},
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Vous avez demandé la réinitialisation de votre mot de passe Chicken Haven.
              Pour définir un nouveau mot de passe, utilisez le code ci-dessous :
            </p>

            <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${verificationCode}</h3>
            </div>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Ce code expirera dans <strong>15 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation,
              ignorez cet email et votre mot de passe restera inchangé.
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Cordialement,<br>
              L'équipe Chicken Haven 🐔
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              Cet email a été écrit par des poules depuis leur poulailler. Ne pas répondre.
            </p>
          </div>
        </div>
      `
    } else {
      // Email d'inscription normale
      subject = 'Vérification de votre compte Chicken Haven'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #7a3e10; text-align: center; margin-bottom: 30px;">🐔 Chicken Haven</h1>

            <h2 style="color: #421d00; margin-bottom: 20px;">Bienvenue ${username} !</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Merci de vous être inscrit sur Chicken Haven ! Pour finaliser votre inscription,
              veuillez utiliser le code de vérification ci-dessous :
            </p>

            <div style="background-color: #ffd700; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h3 style="color: #421d00; margin: 0; font-size: 24px; letter-spacing: 3px;">${verificationCode}</h3>
            </div>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Ce code expirera dans <strong>15 minutes</strong>. Si vous n'avez pas demandé cette inscription,
              vous pouvez ignorer cet email.
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Cordialement,<br>
              L'équipe Chicken Haven 🐔
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              Cet email a été écrit par des poules depuis leur poulailler. Ne pas répondre.
            </p>
          </div>
        </div>
      `
    }

    const mailOptions = {
      from: `"Chicken Haven" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 Email ${emailType} envoyé:`, info.messageId)
    return true
  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    return false
  }
}

// Fonction pour générer un code de vérification
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString() // Code à 6 chiffres
}