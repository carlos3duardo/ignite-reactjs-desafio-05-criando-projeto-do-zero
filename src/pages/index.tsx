import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import ExitPreview from '../components/ExitPreview';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(() => {
    return postsPagination.results.map(post => {
      return {
        ...post,
        first_publication_date: post.first_publication_date
          ? format(new Date(post.first_publication_date), 'd MMM yyyy', {
              locale: ptBR,
            })
          : null,
      };
    });
  });

  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleNextPage(): Promise<void> {
    const nextPageResponse = await fetch(`${nextPage}`).then(response =>
      response.json()
    );

    const newPosts = nextPageResponse.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date
          ? format(new Date(post.first_publication_date), 'd MMM yyyy', {
              locale: ptBR,
            })
          : null,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setNextPage(nextPageResponse.next_page);
    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <h2 className={styles.postTitle}>{post.data.title}</h2>
                <p className={styles.postSubtitle}>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <time className={styles.info}>
                    <FiCalendar /> {post.first_publication_date}
                  </time>
                  <span className={styles.info}>
                    <FiUser /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button
              type="button"
              className={styles.btnMorePosts}
              onClick={handleNextPage}
            >
              Carregar mais posts
            </button>
          )}
        </div>
        <footer>{preview && <ExitPreview />}</footer>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 4,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const results = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  // const { next_page } = response;
  const postsPagination = {
    next_page: response.next_page,
    results,
  };

  return {
    props: { postsPagination, preview },
  };
};
