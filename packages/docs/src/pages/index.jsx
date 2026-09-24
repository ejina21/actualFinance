import Link from '@docusaurus/Link';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import Layout from '@theme/Layout';

import classes from './index.module.css';

const features = [
  {
    title: 'Планируйте бюджет',
    description:
      'Распределяйте деньги по категориям и заранее решайте, на что их потратить.',
    to: '/docs/budgeting/',
    link: 'Как устроен бюджет',
  },
  {
    title: 'Следите за операциями',
    description:
      'Учитывайте счета, доходы и расходы, импортируйте операции и создавайте правила.',
    to: '/docs/accounts/',
    link: 'Счета и операции',
  },
  {
    title: 'Анализируйте финансы',
    description:
      'Изучайте отчёты, чтобы понимать динамику расходов и состояние бюджета.',
    to: '/docs/reports/',
    link: 'Открыть отчёты',
  },
];

export default function Home() {
  useBrokenLinks().collectAnchor('features');

  return (
    <Layout
      title="Личные финансы под вашим контролем"
      description="Русскоязычная справка по Actual Budget: бюджет, счета, операции, правила, отчёты и настройки."
    >
      <main className={classes.container}>
        <section className={classes.hero}>
          <div className={classes.heroContent}>
            <p className={classes.eyebrow}>ACTUAL BUDGET</p>
            <h1>Личные финансы под вашим контролем</h1>
            <p className={classes.lead}>
              Actual помогает планировать расходы, вести счета и видеть, куда
              уходят деньги. Данные хранятся на вашем устройстве; синхронизация
              между устройствами доступна при подключении сервера.
            </p>
            <div className={classes.actions}>
              <Link
                className="button button--primary button--lg"
                to="/docs/tour/"
              >
                Посмотреть обзор
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/">
                Читать документацию
              </Link>
            </div>
          </div>
          <div
            className={classes.preview}
            aria-label="Пример распределения бюджета"
          >
            <div className={classes.previewHeader}>
              <span>Пример бюджета</span>
              <strong>Сентябрь</strong>
            </div>
            <div className={classes.previewBalance}>
              <span>Доступно для распределения</span>
              <strong>24 500 ₽</strong>
            </div>
            <div className={classes.previewRows}>
              <div>
                <span>Категория</span>
                <span>Запланировано</span>
              </div>
              <div>
                <span>Продукты</span>
                <strong>18 000 ₽</strong>
              </div>
              <div>
                <span>Транспорт</span>
                <strong>5 000 ₽</strong>
              </div>
              <div>
                <span>Связь и интернет</span>
                <strong>1 500 ₽</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={classes.features}>
          <div className={classes.sectionHeading}>
            <h2>Что можно делать в Actual</h2>
            <p>Начните с нужной темы и переходите к подробным инструкциям.</p>
          </div>
          <div className={classes.cards}>
            {features.map(feature => (
              <article className={classes.card} key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Link to={feature.to}>{feature.link} →</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
