import type {
  NextPage,
  GetStaticProps, 
  InferGetStaticPropsType} from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useContext } from 'react'
import styled from 'styled-components'
import ItemList from '../components/ItemList'
import { AppContext } from '../context/AppContext'
import { fetchAPI } from '../lib/api'
import { button } from '../styles/styles'
import { FrontPageFields } from '../utils/models'

export const getStaticProps: GetStaticProps<{content: FrontPageFields}> = async (context) => {
  const [content] = await Promise.all([
    fetchAPI<FrontPageFields>('/front-page',{},{
      locale: context.locale,
    })
  ]);
  return {
    props: {
      content,
    },
    revalidate: 60,
  }
}

type PropType = InferGetStaticPropsType<typeof getStaticProps>

const StyledLink = styled.a`
  text-decoration: none;
  ${button}
`;

const Wrapper = styled.main`
  width: 100%;
  max-width: 1000px;
  margin: auto;
`;

const Home: NextPage<PropType> = ({content}) => {
  const {items} = useContext(AppContext)
  const { title, bodyText } = content.attributes;

  return (
    <div>
      <Head>
        <title>Ilmotunkki</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Wrapper>
        <h1>{title}</h1>
        <section>
          <p>
            {bodyText}
          </p>
          <ItemList />
          {items.length > 0 && <Link href={'/contact'} passHref><StyledLink >Seuraava</StyledLink></Link>}
        </section>
      </Wrapper>
    </div>
  )
}

export default Home
