
// Force restart - updated quest data
import('file://' + process.cwd() + '/src/index.js')
  .catch(err => {
    console.error('❌ Échec du lancement du serveur :', err)
    process.exit(1)
  })
