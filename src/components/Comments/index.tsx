import { useEffect } from 'react';
import styles from './comments.module.scss';

export default function Comments(): JSX.Element {
  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute(
      'repo',
      'carlos3duardo/ignite-reactjs-desafio-05-criando-projeto-do-zero'
    );
    script.setAttribute('issue-term', 'title');
    script.setAttribute('theme', 'photon-dark');
    anchor.appendChild(script);
  }, []);

  return <div className={styles.comments} id="inject-comments-for-uterances" />;
}
