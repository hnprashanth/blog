const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;

  return new Promise((resolve, reject) => {
    const blogPost = path.resolve('./src/templates/blog-post.js');

    // Create index pages for all supported languages
    createPage({
      path: '/',
      component: path.resolve('./src/templates/blog-index.js'),
      context: {
        langKey: 'en',
      },
    });

    resolve(
      graphql(
        `
          {
            allMarkdownRemark(
              sort: { fields: [frontmatter___date], order: DESC }
              limit: 1000
            ) {
              edges {
                node {
                  fields {
                    slug
                    langKey
                  }
                  frontmatter {
                    title
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors);
          reject(result.errors);
          return;
        }

        // Create blog posts pages.
        const posts = result.data.allMarkdownRemark.edges;

        const defaultLangPosts = posts;
        _.each(defaultLangPosts, (post, index) => {
          const previous =
            index === defaultLangPosts.length - 1
              ? null
              : defaultLangPosts[index + 1].node;
          const next = index === 0 ? null : defaultLangPosts[index - 1].node;

          createPage({
            path: post.node.fields.slug,
            component: blogPost,
            context: {
              slug: post.node.fields.slug,
              previous,
              next,
            },
          });
        });
      })
    );
  });
};
