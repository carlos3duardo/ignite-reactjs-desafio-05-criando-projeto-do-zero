import Link from 'next/link';
import styles from './exitPreview.module.scss';

export default function ExitPreview(): JSX.Element {
  return (
    <Link href="/api/exit-preview">
      <a className={styles.exitPreview}>Sair do Modo Preview</a>
    </Link>
  );
}
