package node.visitor;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.Before;
import org.junit.Test;

import content.Author;
import content.Content;
import content.StringContent;
import node.DocumentNode;
import node.Node;
import node.RootNode;
public class visitorTests {
	
	
	private StringContent.builder contentBuilder = StringContent.builder.get() ;
	private DocumentNode.builder nodeBuilder = DocumentNode.builder.get();
	private Node fatherNode;
	private Node firstChild;
	private Node secondChild;
	private Author gabibbo;
	private Author ceccherini;
	private Node ceccheriniNode;
	
	@Before
	public void setup() {
		
		gabibbo = Author.getNewAuthor("Il Gabibbo");
		
		Content<String> DocumentTitle = contentBuilder.withAuthor(gabibbo)
				.withContent("Libro del gabibbo")
				.build();
		
		this.fatherNode = nodeBuilder.withContent(DocumentTitle)
				.build();
		
		Content<String> firstChildContent = contentBuilder.withAuthor(gabibbo)
				.withContent("Primo capitolo libro del gabibbo")
				.build();
		
		this.firstChild = nodeBuilder.withContent(firstChildContent)
				.withParent(fatherNode)
				.build();
		
		Content<String> secondChildContent = contentBuilder.withAuthor(gabibbo)
				.withContent("Secondo capitolo libro del gabibbo")
				.build();
		
		this.secondChild = nodeBuilder.withContent(secondChildContent)
				.withParent(fatherNode)
				.build();
		
		ceccherini = Author.getNewAuthor("Massimo Ceccherini");
		
		Content<String> otherAuthorContent = contentBuilder.withContent("Bischerate")
				.withAuthor(ceccherini)
				.build();
		
		ceccheriniNode = nodeBuilder.withContent(otherAuthorContent).withParent(secondChild).build();
		
	}

	
	@Test
	public void topNodeVisitorTest(){
		assertThat(secondChild.accept(TopNodeFindVisitor.get())).isEqualTo(fatherNode);
		assertThat(firstChild.accept(TopNodeFindVisitor.get())).isEqualTo(fatherNode);
		assertThat(fatherNode.accept(TopNodeFindVisitor.get())).isEqualTo(fatherNode);
		assertThat(RootNode.getInstance().accept(TopNodeFindVisitor.get())).isEqualTo(RootNode.getInstance());
	}
	
	@Test
	public void ContentListVisitorTest() {
		List<Content<?>> contentList = fatherNode.accept(ContentListVisitor.get());
		
		assertThat(contentList.get(0)).isEqualTo(fatherNode.content());
		assertThat(contentList.get(1)).isEqualTo(firstChild.content());
		assertThat(contentList.get(2)).isEqualTo(secondChild.content());
	}
	
	@Test
	public void AuthorVisitorTest()  {


		
		
		assertThat(ceccheriniNode.accept(AuthorVisitor.withAuthor(gabibbo))).isEqualTo(secondChild);
		assertThat(secondChild.accept(AuthorVisitor.withAuthor(ceccherini))).isEqualTo(RootNode.getInstance());
		
		
		
	}
	

	@Test
	public void searchByTest() {
		NodeVisitor<Node> visitor = MatchingVisitor.matching(i -> i.content()
				.equals(secondChild.content()));
			
		assertThat(fatherNode.accept(visitor)).isEqualTo(secondChild);
			assertThat(secondChild.accept(visitor)).isEqualTo(secondChild);
		assertThat(firstChild.accept(visitor)).isEqualTo(RootNode.getInstance());
		assertThat(RootNode.getInstance().accept(visitor)).isEqualTo(RootNode.getInstance());
		
		
		NodeVisitor<Node> wrongVisitor = MatchingVisitor.matching(i -> i.content().show()
				.equals("Wrong String"));
		
		assertThat(fatherNode.accept(wrongVisitor)).isEqualTo(RootNode.getInstance());
				
		
		NodeVisitor<Node> findWithAuthor = MatchingVisitor.matching(i -> i.content().author()
				.equals(ceccherini));
	
		assertThat(fatherNode.accept(findWithAuthor)).isEqualTo(ceccheriniNode);
		
	}
}
