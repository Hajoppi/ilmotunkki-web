import type {
  NextPage,
  GetStaticProps, 
  InferGetStaticPropsType} from 'next'
import styled from 'styled-components';
import { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react';
import { fetchAPI } from '../../lib/api';
import { AppContext } from '../../context/AppContext';
import { button, Input, Label } from '../../styles/styles';
import { ContactForm,Field } from '../../utils/models';
import { useRouter } from 'next/router';
import Link from 'next/link';

const Button = styled.button`
  ${button}
`;

export const getStaticProps: GetStaticProps<{contactForm: Field[]}> = async (context) => {
  const formData = await fetchAPI<ContactForm>('/contact-form',{},{
    locale: context.locale,
    populate: 'contactForm',
  });
  return {
    props: {
      contactForm: formData.attributes.contactForm
    },
    revalidate: 60,
  }
}

type PropType = InferGetStaticPropsType<typeof getStaticProps>

const Form: NextPage<PropType> = ({contactForm}) => {
  const router = useRouter();
  const {customer, refreshFields} = useContext(AppContext);
  const [inputFields, setInputFields] = useState(customer.attributes);
  useEffect(() => {
    setInputFields(customer.attributes);
  },[customer])
  if(!customer.id) {
    return null;
  }
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const updateFields: any = {...inputFields};
    delete updateFields.createdAt;
    delete updateFields.updatedAt;
    delete updateFields.publishedAt;
    await fetchAPI(`/customers/${customer.attributes.uid}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: {
          ...updateFields,
        }
      }),
    });
    await refreshFields();
    router.push('/summary');
  };
  const handleChange = (event: ChangeEvent<HTMLInputElement>, key: string) => {
    setInputFields(previousKeys => {
      return {
        ...previousKeys,
        [key]: event.target.value,
      }
    })
  }
  return (
    <div>
      <form onSubmit={handleSubmit}>
        {contactForm.map(field => (
          <Label key={field.fieldName}>
          {field.label}
          <Input 
            type={field.type}
            onChange={(event: ChangeEvent<HTMLInputElement>) => handleChange(event, field.fieldName)}
            value={inputFields[field.fieldName] || ''}
            required={field.required}
          />
        </Label>
        ))}
        <Button>Lähetä</Button>
      </form>
      <Link href="/">
        <Button>Takaisin</Button>
      </Link>
    </div>

  );
}

export default Form;