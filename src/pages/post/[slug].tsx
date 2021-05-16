import { useEffect, useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import ExitPreview from '../../components/ExitPreview';
import Comments from '../../components/Comments';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  navigation: {
    prevPost: Post[];
    nextPost: Post[];
  };
  preview: boolean;
}

export default function Post({
  post,
  navigation,
  preview,
}: PostProps): JSX.Element {
  const [readTime, setReadTime] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const words = post.data.content.reduce((accumulator, current) => {
      const wordsHeading = current.heading.split(' ').length;
      const wordsText = current.body.reduce((bodyAccumulator, bodyCurrent) => {
        return bodyAccumulator + bodyCurrent.text.split(' ').length;
      }, 0);

      return accumulator + wordsHeading + wordsText;
    }, 0);

    setReadTime(Math.ceil(words / 200));
  }, [post.data.content]);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const updatedAt =
    post.first_publication_date !== post.last_publication_date
      ? format(
          new Date(post.first_publication_date),
          "dd MMM yyyy ', às ' H:m",
          {
            locale: ptBR,
          }
        )
      : null;

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <div className={styles.post}>
        <header className={styles.postHeader}>
          <figure>
            <img src={post.data.banner.url} alt="Banner" />
          </figure>
        </header>
        <main className={commonStyles.container}>
          <article className={styles.postContainer}>
            <h1 className={styles.postTitle}>{post.data.title}</h1>
            <ul className={styles.postInfo}>
              <li>
                <FiCalendar /> {formattedDate}
              </li>
              <li>
                <FiUser />
                {post.data.author}
              </li>
              <li>
                <FiClock />
                {readTime} min
              </li>
            </ul>
            {updatedAt && (
              <time className={styles.updatedAt}>
                *** atualizado em {updatedAt}
              </time>
            )}
            <div className={styles.postContent}>
              {post.data.content.map(content => (
                <section key={content.heading}>
                  <h3>{content.heading}</h3>
                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </section>
              ))}
            </div>
          </article>

          <footer className={styles.postFooter}>
            <nav className={styles.navPosts}>
              <div className={`${styles.navLink} ${styles.prevPost}`}>
                {navigation.prevPost.length > 0 && (
                  <>
                    <span>post anterior</span>
                    <Link href={`/post/${navigation.prevPost[0].uid}`}>
                      <a>
                        <strong>{navigation.prevPost[0].data.title}</strong>
                      </a>
                    </Link>
                  </>
                )}
              </div>

              <div className={`${styles.navLink} ${styles.nextPost}`}>
                {navigation.nextPost.length > 0 && (
                  <>
                    <span>próximo post</span>
                    <Link href={`/post/${navigation.nextPost[0].uid}`}>
                      <a>
                        <strong>{navigation.nextPost[0].data.title}</strong>
                      </a>
                    </Link>
                  </>
                )}
              </div>
            </nav>
            <Comments />
            {preview && <ExitPreview />}
          </footer>
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const post = {
    uid: response?.uid,
    first_publication_date: response?.first_publication_date,
    last_publication_date: response?.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', response.type)],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', response.type)],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
